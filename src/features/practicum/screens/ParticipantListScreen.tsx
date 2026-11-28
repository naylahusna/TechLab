import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { CsvImport } from '../../imports/CsvImport';
import { watchLabLocations, watchCourseLabSettings, type CourseLabSettings, type LabLocation } from '../../assistant/lab-locations';
import { resolveCourseLabs } from '../../assistant/lab-location-policy';
import { practitionerCsvHeaders, parsePractitionerRow } from '../practitioner-csv';
import { ActionButton } from '../../../components/ActionButton';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import { Text } from '../../../components/Text';
import { getPracticumRepository } from '../client';
import { InlineAction } from '../components/InlineAction';
import { PracticumField } from '../components/PracticumField';
import { PracticumHeader } from '../components/PracticumHeader';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { SyncStatusBanner } from '../components/SyncStatusBanner';
import { practicumErrorMessage } from '../errors';
import { useParticipants, usePracticumClass } from '../hooks';
import { colors, fontWeights, lineHeights, radius, spacing, typography } from '../theme';
import type { PracticumClass, PracticumDirectoryUser, PracticumParticipant } from '../types';

export function ParticipantListScreen({ classId }: { classId: string }) {
  const router = useRouter();
  const classState = usePracticumClass(classId);
  const participants = useParticipants(classId);
  const [labs, setLabs] = useState<LabLocation[]>([]);
  const [settings, setSettings] = useState<CourseLabSettings | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<PracticumDirectoryUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [pendingRemove, setPendingRemove] = useState<PracticumParticipant | null>(null);
  const [moveDraft, setMoveDraft] = useState<{ participant: PracticumParticipant; classes: PracticumClass[] } | null>(null);
  const [pendingMove, setPendingMove] = useState<{ participant: PracticumParticipant; target: PracticumClass } | null>(null);
  const searchSequence = useRef(0);

  const courseName = classState.item?.courseName;
  const labId = classState.item?.labId;
  const courseLabs = courseName ? resolveCourseLabs(labs, courseName, settings?.courseName === courseName ? settings.labIds : undefined)
    .filter((lab) => settings?.courseName === courseName || lab.legacyCourseName === courseName) : [];
  const rosterLab = courseLabs.find((lab) => lab.id === labId);
  useEffect(() => watchLabLocations(setLabs, (cause) => setActionError(practicumErrorMessage(cause))), []);
  useEffect(() => {
    if (courseName) return watchCourseLabSettings(courseName, setSettings, (cause) => setActionError(practicumErrorMessage(cause)));
  }, [courseName]);

  async function chooseRosterLab(id: string) {
    if (busyId || importBusy) return;
    setBusyId(id);
    setActionError('');
    try {
      await getPracticumRepository().setRosterLab(classId, id);
      await classState.reload();
    } catch (cause) { setActionError(practicumErrorMessage(cause)); }
    finally { setBusyId(null); }
  }

  function goBack() {
    router.dismissTo(`/kelas/${classId}`);
  }

  const search = useCallback(async () => {
    const query = term.trim();
    const sequence = ++searchSequence.current;
    if (!query) {
      setResults([]);
      setSearchError('');
      setSearching(false);
      return;
    }
    setSearching(true);
    setSearchError('');
    setResults([]);
    try {
      const users = await getPracticumRepository().searchDirectoryUsers(query);
      if (sequence !== searchSequence.current) return;
      setResults(users);
      if (users.length === 0) setSearchError('Pengguna tidak ditemukan.');
    } catch (cause) {
      if (sequence !== searchSequence.current) return;
      setSearchError(practicumErrorMessage(cause));
    } finally {
      if (sequence === searchSequence.current) setSearching(false);
    }
  }, [term]);

  useEffect(() => {
    const timer = setTimeout(() => { void search(); }, term.trim() ? 250 : 0);
    return () => clearTimeout(timer);
  }, [search, term]);

  async function add(user: PracticumDirectoryUser) {
    if (busyId || importBusy || !rosterLab) return;
    setBusyId(user.uid);
    setActionError('');
    try {
      await getPracticumRepository().addParticipant({
        classId,
        userId: user.uid,
        studentName: user.name,
        studentNumber: user.number,
      });
      setResults((previous) => previous.filter((item) => item.uid !== user.uid));
      await participants.reload();
    } catch (cause) {
      setActionError(practicumErrorMessage(cause));
    } finally {
      setBusyId(null);
    }
  }

  async function prepareMove(participant: PracticumParticipant) {
    if (busyId || importBusy || !courseName || !rosterLab) return;
    setBusyId(participant.userId);
    setActionError('');
    try {
      const available = await getPracticumRepository().listClassesForAslab([courseName]);
      const targets = available.filter((item) => item.id !== classId && item.labId && item.labId !== labId
        && courseLabs.some((lab) => lab.id === item.labId));
      if (!targets.length) throw new Error('Belum ada kelas tujuan dengan lab aktif yang berbeda.');
      setMoveDraft({ participant, classes: targets });
    } catch (cause) { setActionError(practicumErrorMessage(cause)); }
    finally { setBusyId(null); }
  }

  async function move() {
    if (!pendingMove || busyId || importBusy) return;
    setBusyId(pendingMove.participant.userId);
    setActionError('');
    try {
      await getPracticumRepository().moveParticipant(classId, pendingMove.target.id, pendingMove.participant.userId);
      setPendingMove(null);
      await participants.reload();
    } catch (cause) { setActionError(practicumErrorMessage(cause)); setPendingMove(null); }
    finally { setBusyId(null); }
  }

  async function remove() {
    if (!pendingRemove || busyId || importBusy) return;
    setBusyId(pendingRemove.userId);
    setActionError('');
    try {
      await getPracticumRepository().removeParticipant(classId, pendingRemove.userId);
      setPendingRemove(null);
      await participants.reload();
    } catch (cause) {
      setActionError(practicumErrorMessage(cause));
      setPendingRemove(null);
    } finally {
      setBusyId(null);
    }
  }

  const loading =
    (classState.status === 'loading' || participants.status === 'loading') &&
    participants.items.length === 0;
  const error = classState.error ?? participants.error;

  return (
    <View style={styles.screen}>
      <PracticumHeader
        eyebrow="Aslab"
        title="Kelola Peserta"
        subtitle={classState.item?.className ?? 'Peserta praktikum kelas.'}
        onBack={goBack}
      />

      <SyncStatusBanner
        error={classState.syncError ?? participants.syncError}
        fromCache={classState.fromCache || participants.fromCache}
        onRetry={() => {
          classState.retrySync();
          participants.retrySync();
        }}
      />

      {loading ? <LoadingState message="Memuat peserta…" /> : null}

      {!loading && error ? (
        <ErrorState
          message={error}
          onRetry={() => {
            void classState.reload();
            void participants.reload();
          }}
        />
      ) : null}

      {!loading && !error ? (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Lab roster</Text>
            {rosterLab ? <Text>{rosterLab.name} · {courseName}</Text> : labId ? (
              <Text style={styles.note}>Lab roster tidak aktif pada mata kuliah ini. Periksa tautan lab.</Text>
            ) : (
              <>
                <Text style={styles.note}>Tetapkan lab untuk roster kelas sebelum menambah Praktikan.</Text>
                {courseLabs.map((lab) => <ActionButton key={lab.id} title={lab.name} secondary disabled={!!busyId}
                  onPress={() => void chooseRosterLab(lab.id)} />)}
                {courseLabs.length === 0 && <Text>Tautkan lab ke mata kuliah ini terlebih dahulu.</Text>}
              </>
            )}
          </View>
          {rosterLab && <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tambah Praktikan</Text>
            <Text style={styles.note}>
              Cari praktikan berdasarkan NIM atau nama, lalu tambahkan ke kelas.
            </Text>
            <PracticumField
              label="Cari NIM atau nama"
              value={term}
              onChangeText={(value) => {
                searchSequence.current += 1;
                setTerm(value);
                setResults([]);
                setSearchError('');
              }}
              placeholder="Contoh: 240101001 atau Alya"
              autoCapitalize="none"
            />
            <ActionButton
              title={searching ? 'Mencari…' : 'Cari Pengguna'}
              onPress={() => {
                void search();
              }}
              disabled={searching || !term.trim()}
            />
            {searchError ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {searchError}
              </Text>
            ) : null}
            {results.length > 0 ? (
              <View style={styles.results}>
                {results.map((user) => (
                  <View key={user.uid} style={styles.resultRow}>
                    <View style={styles.resultInfo}>
                      <Text style={styles.name}>{user.name}</Text>
                      <Text style={styles.meta}>{user.number}</Text>
                    </View>
                    <InlineAction
                      label={busyId === user.uid ? 'Menambah…' : 'Tambah'}
                      variant="primary"
                      disabled={!!busyId || importBusy}
                      onPress={() => {
                        void add(user);
                      }}
                    />
                  </View>
                ))}
              </View>
            ) : null}
            {searching && results.length === 0 ? (
              <Text style={styles.meta}>Mencari peserta...</Text>
            ) : null}
          </View>

          <View style={styles.card}>
            <CsvImport title="Unggah Praktikan" filename="template-praktikan-techlab.csv"
              headers={practitionerCsvHeaders} validate={parsePractitionerRow} identity={(number) => number}
              onBusyChange={setImportBusy} check={async (number) => {
                const user = await getPracticumRepository().resolvePractitionerByNumber(number);
                return user.name + ' · ' + user.number;
              }} save={async (number) => {
                if (busyId) throw new Error('Tunggu perubahan peserta yang sedang berjalan.');
                const repo = getPracticumRepository();
                const user = await repo.resolvePractitionerByNumber(number);
                await repo.addParticipant({ classId, userId: user.uid, studentName: user.name, studentNumber: user.number }, true);
                return user.name + ' terdaftar di roster.';
              }} />
          </View>
          </>}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Peserta Terdaftar</Text>
            {participants.items.length === 0 ? (
              <EmptyState
                title="Belum ada peserta"
                message="Tambahkan praktikan melalui pencarian di atas."
              />
            ) : (
              <View style={styles.results}>
                {participants.items.map((participant) => (
                  <View key={participant.id} style={styles.resultRow}>
                    <View style={styles.resultInfo}>
                      <Text style={styles.name}>{participant.studentName}</Text>
                      <Text style={styles.meta}>{participant.studentNumber}</Text>
                    </View>
                    {rosterLab && <InlineAction label="Pindah lab" variant="primary"
                      disabled={!!busyId || importBusy} onPress={() => void prepareMove(participant)} />}
                    <InlineAction
                      label="Hapus"
                      variant="danger"
                      disabled={!!busyId || importBusy}
                      onPress={() => setPendingRemove(participant)}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>

          {moveDraft && <View style={styles.card}>
            <Text style={styles.cardTitle}>Pilih lab tujuan · {moveDraft.participant.studentName}</Text>
            {moveDraft.classes.map((item) => <ActionButton key={item.id}
              title={item.className + ' · ' + (courseLabs.find((lab) => lab.id === item.labId)?.name ?? '')}
              secondary onPress={() => { setPendingMove({ participant: moveDraft.participant, target: item }); setMoveDraft(null); }} />)}
            <ActionButton title="Batalkan pemilihan" secondary onPress={() => setMoveDraft(null)} />
          </View>}
          {actionError ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {actionError}
            </Text>
          ) : null}
        </ScrollView>
      ) : null}

      <ConfirmationModal visible={!!pendingMove} title="Pindahkan Praktikan?"
        description={pendingMove ? `${pendingMove.participant.studentName} akan pindah ke ${pendingMove.target.className}. Jadwal dan catatan lama tetap tersimpan.` : ''}
        confirmLabel="Pindahkan" busy={!!busyId} onConfirm={() => void move()} onCancel={() => setPendingMove(null)} />
      <ConfirmationModal
        visible={!!pendingRemove}
        eyebrow="KONFIRMASI PESERTA"
        title="Hapus peserta ini?"
        description={`${pendingRemove?.studentName ?? ''} akan dikeluarkan dari kelas. Riwayat presensi dan izin tetap tersimpan.`}
        confirmLabel="Hapus Peserta"
        onConfirm={() => {
          void remove();
        }}
        onCancel={() => setPendingRemove(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.bodyLarge,
    fontWeight: fontWeights.bold,
  },
  note: {
    color: colors.textMuted,
    fontSize: typography.secondary,
    lineHeight: lineHeights.body,
  },
  results: { gap: spacing.sm },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resultInfo: { flex: 1, gap: 2 },
  name: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: fontWeights.semibold,
  },
  meta: {
    color: colors.textMuted,
    fontSize: typography.caption,
  },
  error: {
    color: colors.danger,
    fontSize: typography.body,
    lineHeight: lineHeights.body,
  },
});
