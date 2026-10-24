import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ActionButton } from '../../components/ActionButton';
import { AppPage } from '../../components/AppPage';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { Text } from '../../components/Text';
import { useRole } from '../../core/role-context';
import { colors } from '../../theme/tokens';
import { findAssistantSession } from '../../features/assistant/assistant-sessions';
import { attendanceCounts, attendanceRoster } from '../../core/session-state';

export default function AssistantSessionDetailRoute() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { currentUser, sessionStatuses, openSession, closeSession, attendanceRecords } = useRole();
  const [confirmation, setConfirmation] = useState<'open' | 'close' | null>(null);
  const [attendanceFilter, setAttendanceFilter] = useState<'semua' | 'hadir' | 'belum'>('semua');

  if (!currentUser) return <Redirect href="/" />;
  if (currentUser.role !== 'asisten') return <Redirect href="/jadwal" />;

  const session = typeof sessionId === 'string' ? findAssistantSession(sessionId) : null;
  if (!session || session.assistantId !== currentUser.id) return <Redirect href="/jadwal" />;
  const activeSession = session;
  const status = sessionStatuses[activeSession.id] ?? activeSession.status;
  const attendance = attendanceCounts(activeSession.id, attendanceRecords);
  const participants = attendanceRoster(activeSession.id, attendanceRecords);
  const filteredParticipants = participants.filter(({ attendedAt }) =>
    attendanceFilter === 'semua' || (attendanceFilter === 'hadir' ? Boolean(attendedAt) : !attendedAt),
  );

  function handleOpenSession() {
    setConfirmation('open');
  }

  function handleCloseSession() {
    setConfirmation('close');
  }

  function confirmTransition() {
    if (confirmation === 'open') openSession(activeSession.id);
    if (confirmation === 'close') closeSession(activeSession.id);
    setConfirmation(null);
  }

  return (
    <AppPage title="Detail sesi" subtitle="Informasi pelaksanaan praktikum yang kamu tangani.">
      <View style={styles.statusCard}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>{status}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>MATA PRAKTIKUM</Text>
        <Text accessibilityRole="header" style={styles.course}>{activeSession.course}</Text>
        <Text style={styles.description}>{activeSession.description}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Informasi pelaksanaan</Text>
        <DetailRow label="Hari dan tanggal" value={`${session.day}, ${session.date}`} />
        <DetailRow label="Waktu" value={activeSession.time} />
        <DetailRow label="Kelas" value={activeSession.group} />
        <DetailRow label="Ruangan" value={activeSession.room} last />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Ringkasan kehadiran</Text>
        <View style={styles.attendanceRow}>
          <AttendanceTile count={attendance.present} label="Hadir" color={colors.success} />
          <AttendanceTile count={attendance.absent} label="Belum hadir" color={colors.danger} />
          <AttendanceTile count={attendance.total} label="Total" color={colors.navy} />
        </View>
        <Text style={styles.attendanceHint}>Jumlah hadir dihitung dari presensi yang tercatat untuk sesi ini.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Daftar peserta</Text>
        <View style={styles.filterRow}>
          <AttendanceFilter label={`Semua (${participants.length})`} selected={attendanceFilter === 'semua'} onPress={() => setAttendanceFilter('semua')} />
          <AttendanceFilter label={`Hadir (${attendance.present})`} selected={attendanceFilter === 'hadir'} onPress={() => setAttendanceFilter('hadir')} />
          <AttendanceFilter label={`Belum (${attendance.absent})`} selected={attendanceFilter === 'belum'} onPress={() => setAttendanceFilter('belum')} />
        </View>
        {filteredParticipants.length > 0 ? filteredParticipants.map(({ student, attendedAt }) => (
          <View key={student.id} style={styles.participantRow}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{student.initials}</Text></View>
            <View style={styles.participantInfo}>
              <Text style={styles.participantName}>{student.name}</Text>
              <Text style={styles.participantNumber}>{student.number}</Text>
            </View>
            <View style={styles.attendanceInfo}>
              <Text style={[styles.participantStatus, { color: attendedAt ? colors.success : colors.danger }]}>
                {attendedAt ? 'Hadir' : 'Belum hadir'}
              </Text>
              <Text style={styles.attendanceTime}>{attendedAt ? formatAttendanceTime(attendedAt) : 'Waktu —'}</Text>
            </View>
          </View>
        )) : <Text style={styles.attendanceHint}>{participants.length === 0 ? 'Belum ada peserta terdaftar untuk kelas ini.' : 'Tidak ada peserta dengan status ini.'}</Text>}
      </View>

      <View style={styles.note}>
        <Text style={styles.noteTitle}>Tugas asisten</Text>
        <Text style={styles.noteCopy}>
          Dampingi praktikan selama sesi dan pastikan kegiatan berjalan sesuai materi praktikum.
        </Text>
      </View>

      <ActionButton
        title={status === 'Sedang berlangsung' ? 'Sesi sedang berlangsung' : status === 'Selesai' ? 'Sesi sudah ditutup' : 'Buka sesi untuk presensi'}
        onPress={handleOpenSession}
        disabled={status !== 'Akan datang'}
        testID="open-session"
      />
      {status === 'Sedang berlangsung' ? (
        <ActionButton title="Tutup sesi" onPress={handleCloseSession} testID="close-session" />
      ) : null}

      <ActionButton title="Kembali ke jadwal" onPress={() => router.back()} secondary />
      <ConfirmationModal
        visible={confirmation !== null}
        title={confirmation === 'open' ? 'Buka sesi praktikum?' : 'Tutup sesi praktikum?'}
        description={confirmation === 'open' ? 'Praktikan akan dapat melakukan presensi setelah sesi dibuka.' : 'Praktikan tidak dapat melakukan presensi baru setelah sesi ditutup. Sesi yang sudah ditutup tidak dapat dibuka kembali.'}
        confirmLabel={confirmation === 'open' ? 'Ya, buka sesi' : 'Ya, tutup sesi'}
        onConfirm={confirmTransition}
        onCancel={() => setConfirmation(null)}
      />
    </AppPage>
  );
}

function DetailRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, last && styles.lastRow]}>
      <Text style={styles.rowLabel}>{label}</Text>
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

function AttendanceFilter({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.filterChip, selected && styles.filterChipSelected, pressed && styles.filterPressed]}
    >
      <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function formatAttendanceTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `Pukul ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
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
  description: { color: colors.muted, fontSize: 13, lineHeight: 21 },
  sectionTitle: { color: colors.navy, fontSize: 15, fontWeight: '800', marginBottom: 2 },
  row: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingVertical: 10,
    gap: 4,
  },
  lastRow: { borderBottomWidth: 0, paddingBottom: 0 },
  rowLabel: { color: colors.muted, fontSize: 11 },
  rowValue: { color: colors.navy, fontSize: 14, fontWeight: '700' },
  note: { backgroundColor: colors.lavender, padding: 18, borderRadius: 20, gap: 7 },
  noteTitle: { color: colors.navy, fontSize: 14, fontWeight: '800' },
  noteCopy: { color: colors.muted, fontSize: 12, lineHeight: 20 },
  attendanceRow: { flexDirection: 'row', gap: 8 },
  attendanceTile: { flex: 1, backgroundColor: colors.background, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 6, alignItems: 'center', gap: 4 },
  attendanceCount: { fontSize: 23, fontWeight: '800' },
  attendanceLabel: { color: colors.muted, fontSize: 10, fontWeight: '700', textAlign: 'center' },
  attendanceHint: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  participantRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomColor: colors.line, borderBottomWidth: 1 },
  avatar: { width: 38, height: 38, borderRadius: 14, backgroundColor: colors.lavender, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.navy, fontSize: 11, fontWeight: '800' },
  participantInfo: { flex: 1, gap: 3 },
  participantName: { color: colors.navy, fontSize: 13, fontWeight: '800' },
  participantNumber: { color: colors.muted, fontSize: 10 },
  attendanceInfo: { alignItems: 'flex-end', gap: 3 },
  participantStatus: { fontSize: 11, fontWeight: '800' },
  attendanceTime: { color: colors.muted, fontSize: 10 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  filterChip: { borderRadius: 18, backgroundColor: colors.background, paddingHorizontal: 11, paddingVertical: 8 },
  filterChipSelected: { backgroundColor: colors.navy },
  filterPressed: { opacity: 0.75 },
  filterText: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  filterTextSelected: { color: colors.white },
});
