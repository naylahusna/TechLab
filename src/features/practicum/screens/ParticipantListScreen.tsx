import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

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
import type { PracticumDirectoryUser, PracticumParticipant } from '../types';

export function ParticipantListScreen({ classId }: { classId: string }) {
  const router = useRouter();
  const classState = usePracticumClass(classId);
  const participants = useParticipants(classId);
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<PracticumDirectoryUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [pendingRemove, setPendingRemove] = useState<PracticumParticipant | null>(null);

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace(`/kelas/${classId}`);
  }

  async function search() {
    if (!term.trim() || searching) return;
    setSearching(true);
    setSearchError('');
    setResults([]);
    try {
      const users = await getPracticumRepository().searchDirectoryUsers(term);
      setResults(users);
      if (users.length === 0) setSearchError('Pengguna tidak ditemukan.');
    } catch (cause) {
      setSearchError(practicumErrorMessage(cause));
    } finally {
      setSearching(false);
    }
  }

  async function add(user: PracticumDirectoryUser) {
    if (busyId) return;
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

  async function remove() {
    if (!pendingRemove || busyId) return;
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
        eyebrow="Asisten"
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
            <Text style={styles.cardTitle}>Tambah Peserta</Text>
            <Text style={styles.note}>
              Cari praktikan berdasarkan NIM atau nama, lalu tambahkan ke kelas.
            </Text>
            <PracticumField
              label="Cari NIM atau nama"
              value={term}
              onChangeText={setTerm}
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
                      disabled={busyId === user.uid}
                      onPress={() => {
                        void add(user);
                      }}
                    />
                  </View>
                ))}
              </View>
            ) : null}
          </View>

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
                    <InlineAction
                      label="Hapus"
                      variant="danger"
                      disabled={busyId === participant.userId}
                      onPress={() => setPendingRemove(participant)}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>

          {actionError ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {actionError}
            </Text>
          ) : null}
        </ScrollView>
      ) : null}

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
