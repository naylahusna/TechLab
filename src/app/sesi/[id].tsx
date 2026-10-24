import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Text } from '../../components/Text';
import { useDemo, selectAttendanceRecord, selectMySession } from '../../core';
import { SessionDetailScreen } from '../../features/practitioner';
import {
  formatDateLabel,
  formatTimeLabel,
  mapSessionStatus,
} from '../../features/practitioner/lib/argamapping';
import type {
  AttendanceActionResult,
  AttendanceInfo,
  SessionDetail,
} from '../../features/practitioner';
import { colors } from '../../theme/tokens';

export default function SesiRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const demo = useDemo();
  const router = useRouter();

  if (!demo.currentUser) return <Redirect href="/" />;
  if (demo.currentUser.role !== 'praktikan') return <Redirect href="/jadwal" />;
  if (!id) return <Redirect href="/jadwal" />;

  const session = selectMySession(demo, id);
  if (!session) {
    return (
      <View style={styles.screen}>
        <Text style={styles.errorText}>Sesi tidak ditemukan.</Text>
      </View>
    );
  }

  const record = selectAttendanceRecord(demo, id, demo.currentUser.id);

  const myAttendance: AttendanceInfo = record
    ? { status: 'hadir', attendedAtLabel: formatTimeLabel(record.recordedAt) }
    : session.status === 'closed'
      ? { status: 'tidak-hadir', attendedAtLabel: null }
      : { status: 'belum-presensi', attendedAtLabel: null };

  const sessionDetail: SessionDetail = {
    id: session.id,
    practicalName: session.practicumName,
    className: session.className,
    lab: session.lab,
    dateLabel: formatDateLabel(session.startsAt),
    timeLabel: formatTimeLabel(session.startsAt),
    status: mapSessionStatus(session.status),
    meetingLabel: `Pertemuan ${session.meeting}`,
    myAttendance,
  };

  function handleConfirmAttendance(): AttendanceActionResult {
    if (!demo.currentUser) {
      return { ok: false, reason: 'Identitas tidak aktif.' };
    }
    if (!session) {
      return { ok: false, reason: 'Sesi tidak ditemukan.' };
    }

    const result = demo.recordAttendance(session.id, demo.currentUser.id);

    if (!result.ok) {
      return { ok: false, reason: result.message };
    }

    // Waktu tampil dibaca dari record store pada render berikutnya.
    return { ok: true };
  }

  return (
    <SessionDetailScreen
      session={sessionDetail}
      praktikan={{
        id: demo.currentUser.id,
        name: demo.currentUser.name,
        nim: demo.currentUser.number,
      }}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/jadwal'))}
      onConfirmAttendance={handleConfirmAttendance}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: colors.muted,
    textAlign: 'center',
  },
});
