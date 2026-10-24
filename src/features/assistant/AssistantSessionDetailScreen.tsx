import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ActionButton } from '../../components/ActionButton';
import { AppPage } from '../../components/AppPage';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { Text } from '../../components/Text';
import {
  attendanceStatusLabels,
  sessionStatusLabels,
  useDemo,
  type ActionResult,
} from '../../core';
import { colors } from '../../theme/tokens';
import {
  formatAttendanceTime,
  formatSessionDate,
  formatSessionTimeRange,
  selectAssistantSession,
  type AttendanceFilter,
} from './session-view';

type Props = { sessionId: string; onBack: () => void };

/** Fahri's session controls and roster, integrated with the one shared demo store. */
export function AssistantSessionDetailScreen({ sessionId, onBack }: Props) {
  const demo = useDemo();
  const [confirmation, setConfirmation] = useState<'open' | 'close' | null>(null);
  const [filter, setFilter] = useState<AttendanceFilter>('all');
  const [feedback, setFeedback] = useState<ActionResult | null>(null);
  const view = selectAssistantSession(demo, sessionId, filter);
  if (!view) return <Redirect href="/jadwal" />;
  const { session, summary, participants, filteredParticipants, notPresentLabel } = view;

  function requestTransition(action: 'open' | 'close') {
    setFeedback(null);
    setConfirmation(action);
  }

  function confirmTransition() {
    if (!confirmation) return;
    // The store rechecks the latest actor/status, including callbacks from an older render.
    const result =
      confirmation === 'open' ? demo.openSession(sessionId) : demo.closeSession(sessionId);
    setFeedback(result);
    setConfirmation(null);
  }

  return (
    <AppPage title="Detail sesi" subtitle="Kelola sesi dan pantau kehadiran peserta praktikum.">
      <View style={styles.statusCard}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>{sessionStatusLabels[session.status]}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>MATA PRAKTIKUM</Text>
        <Text accessibilityRole="header" style={styles.course}>
          {session.practicumName}
        </Text>
        <DetailRow label="Pertemuan" value={String(session.meeting)} />
        <DetailRow label="Hari dan tanggal" value={formatSessionDate(session.startsAt)} />
        <DetailRow label="Waktu" value={formatSessionTimeRange(session.startsAt, session.endsAt)} />
        <DetailRow label="Kelas" value={session.className} />
        <DetailRow label="Ruangan" value={session.lab} />
      </View>
      {feedback && (
        <View style={[styles.feedback, !feedback.ok && styles.errorFeedback]}>
          <Text
            accessibilityRole="alert"
            style={feedback.ok ? styles.successText : styles.errorText}
          >
            {feedback.message}
          </Text>
        </View>
      )}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Ringkasan kehadiran</Text>
        <View style={styles.attendanceRow}>
          <AttendanceTile count={summary.present} label="Hadir" color={colors.success} />
          <AttendanceTile
            count={summary.notPresent}
            label={notPresentLabel}
            color={colors.danger}
          />
          <AttendanceTile count={summary.total} label="Total" color={colors.navy} />
        </View>
        <Text style={styles.hint}>Kehadiran dihitung dari catatan presensi pada sesi ini.</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Daftar peserta</Text>
        <View style={styles.filterRow}>
          <FilterChip
            label={`Semua (${summary.total})`}
            selected={filter === 'all'}
            onPress={() => setFilter('all')}
          />
          <FilterChip
            label={`Hadir (${summary.present})`}
            selected={filter === 'present'}
            onPress={() => setFilter('present')}
          />
          <FilterChip
            label={`${notPresentLabel} (${summary.notPresent})`}
            selected={filter === 'not-present'}
            onPress={() => setFilter('not-present')}
          />
        </View>
        {filteredParticipants.length > 0 ? (
          filteredParticipants.map(({ student, status, record }) => (
            <View
              key={student.id}
              style={styles.participantRow}
              testID={`participant-${student.id}`}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{student.initials}</Text>
              </View>
              <View style={styles.participantInfo}>
                <Text style={styles.participantName}>{student.name}</Text>
                <Text style={styles.participantNumber}>{student.number}</Text>
              </View>
              <View style={styles.attendanceInfo}>
                <Text
                  style={[
                    styles.participantStatus,
                    { color: record ? colors.success : colors.danger },
                  ]}
                >
                  {attendanceStatusLabels[status]}
                </Text>
                <Text style={styles.hint}>
                  {record ? `Pukul ${formatAttendanceTime(record.recordedAt)}` : 'Waktu —'}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.hint}>
            {participants.length === 0
              ? 'Belum ada peserta terdaftar untuk sesi ini.'
              : 'Tidak ada peserta dengan status ini.'}
          </Text>
        )}
      </View>
      <ActionButton
        title={
          session.status === 'open'
            ? 'Sesi Dibuka'
            : session.status === 'closed'
              ? 'Sesi sudah ditutup'
              : 'Buka sesi untuk presensi'
        }
        disabled={!view.canOpen}
        onPress={() => requestTransition('open')}
        testID="open-session"
      />
      {view.canClose && (
        <ActionButton
          title="Tutup sesi"
          onPress={() => requestTransition('close')}
          testID="close-session"
        />
      )}
      {session.status === 'closed' && (
        <Text style={styles.hint}>
          Sesi tidak dapat dibuka kembali. Catatan kehadiran tetap tersimpan.
        </Text>
      )}
      <ActionButton title="Kembali ke jadwal" onPress={onBack} secondary />
      <ConfirmationModal
        visible={confirmation !== null}
        eyebrow="KONFIRMASI SESI"
        title={confirmation === 'open' ? 'Buka sesi praktikum?' : 'Tutup sesi praktikum?'}
        description={`${session.practicumName}, pertemuan ${session.meeting}, ${session.className}. ${confirmation === 'open' ? 'Praktikan dapat melakukan presensi setelah sesi dibuka.' : 'Presensi baru akan dinonaktifkan. Sesi yang ditutup tidak dapat dibuka kembali.'}`}
        confirmLabel={confirmation === 'open' ? 'Ya, buka sesi' : 'Ya, tutup sesi'}
        confirmTestID="confirm-session-transition"
        cancelTestID="cancel-session-transition"
        onConfirm={confirmTransition}
        onCancel={() => setConfirmation(null)}
      />
    </AppPage>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.hint}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function AttendanceTile({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <View style={styles.attendanceTile}>
      <Text style={[styles.attendanceCount, { color }]}>{count}</Text>
      <Text style={styles.attendanceLabel}>{label}</Text>
    </View>
  );
}

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterChip,
        selected && styles.filterChipSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: colors.paleBlue,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.blue },
  statusText: { color: colors.blue, fontSize: 12, fontWeight: '800' },
  card: {
    backgroundColor: colors.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 20,
    gap: 12,
  },
  label: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  course: { color: colors.navy, fontSize: 20, fontWeight: '800', lineHeight: 28 },
  sectionTitle: { color: colors.navy, fontSize: 15, fontWeight: '800' },
  row: { borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: 10, gap: 4 },
  rowValue: { color: colors.navy, fontSize: 14, fontWeight: '700' },
  feedback: { backgroundColor: colors.lime, padding: 18, borderRadius: 20 },
  errorFeedback: { backgroundColor: colors.peach },
  successText: { color: colors.success, fontSize: 13, lineHeight: 21 },
  errorText: { color: colors.danger, fontSize: 13, lineHeight: 21 },
  attendanceRow: { flexDirection: 'row', gap: 8 },
  attendanceTile: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 4,
  },
  attendanceCount: { fontSize: 23, fontWeight: '800' },
  attendanceLabel: { color: colors.muted, fontSize: 10, fontWeight: '700', textAlign: 'center' },
  hint: { color: colors.muted, fontSize: 11, lineHeight: 18 },
  participantRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.navy, fontSize: 11, fontWeight: '800' },
  participantInfo: { flexGrow: 1, flexShrink: 1, gap: 3 },
  participantName: { color: colors.navy, fontSize: 13, fontWeight: '800' },
  participantNumber: { color: colors.muted, fontSize: 10 },
  attendanceInfo: { alignItems: 'flex-end', gap: 3 },
  participantStatus: { fontSize: 11, fontWeight: '800' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  filterChip: {
    borderRadius: 18,
    backgroundColor: colors.background,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  filterChipSelected: { backgroundColor: colors.navy },
  pressed: { opacity: 0.75 },
  filterText: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  filterTextSelected: { color: colors.white },
});
