import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '../../../components/Text';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { InfoRow } from '../components/InfoRow';
import { ATTENDANCE_STATUS_META, SESSION_STATUS_META } from '../lib/status';
import { colors, fontWeights, lineHeights, radius, spacing, typography } from '../theme';
import type {
  AttendanceInfo,
  SessionDetail,
} from '../types';

type SessionDetailScreenProps = {
  session: SessionDetail;
  onBack: () => void;
  onOpenAttendance: () => void;
};

function getAttendanceMomentLabel(attendance: AttendanceInfo): string | null {
  if (attendance.attendedAtDateLabel && attendance.attendedAtLabel) {
    return `pada ${attendance.attendedAtDateLabel} pukul ${attendance.attendedAtLabel}`;
  }

  if (attendance.attendedAtLabel) {
    return `pukul ${attendance.attendedAtLabel}`;
  }

  return null;
}

function getAttendanceHint(attendance: AttendanceInfo): string {
  if (attendance.status === 'izin')
    return 'Asisten menyetujui izinmu. Lihat keputusan lengkap pada tab Izin.';
  if (attendance.status === 'izin-menunggu')
    return 'Pengajuan izinmu masih menunggu keputusan asisten.';
  if (attendance.status === 'hadir') {
    const moment = getAttendanceMomentLabel(attendance);
    return moment ? `Tercatat hadir ${moment}.` : 'Kehadiranmu berhasil dicatat.';
  }

  if (attendance.status === 'tidak-hadir') {
    return 'Sesi telah ditutup dan tidak ada catatan kehadiran untukmu.';
  }

  return 'Kehadiran belum tercatat pada sesi ini.';
}

export function SessionDetailScreen(props: SessionDetailScreenProps) {
  return <SessionDetailContent key={props.session.id} {...props} />;
}

function SessionDetailContent({
  session,
  onBack,
  onOpenAttendance,
}: SessionDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const effectiveAttendance = session.myAttendance;

  const sessionStatus = SESSION_STATUS_META[session.status];
  const attendanceStatus = ATTENDANCE_STATUS_META[effectiveAttendance.status];

  function handleBack() {
    onBack();
  }

  const attendanceHint = getAttendanceHint(effectiveAttendance);

  return (
    <>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kembali ke jadwal"
          onPress={handleBack}
          style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}
        >
          {({ pressed }) => (
            <Text style={[styles.backLabel, pressed ? styles.linkPressed : null]}>Kembali</Text>
          )}
        </Pressable>

        <View>
          <Text style={styles.meeting}>{session.meetingLabel}</Text>
          <Text style={styles.title}>{session.practicalName}</Text>
          <View style={styles.badgeRow}>
            <Badge label={sessionStatus.label} tone={sessionStatus.tone} />
          </View>
        </View>

        <Button label="Buka Halaman Presensi" onPress={onOpenAttendance} />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informasi Sesi</Text>
          <InfoRow label="Kelas" value={session.className} />
          <InfoRow label="Lab" value={session.lab} />
          <InfoRow label="Tanggal" value={session.dateLabel} />
          <InfoRow label="Waktu" value={session.timeRangeLabel} />
          <InfoRow label="Status Sesi" value={sessionStatus.label} last />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Presensi Kamu</Text>
          <View style={styles.attendanceRow}>
            <Text style={styles.attendanceLabel}>Status</Text>
            <Badge label={attendanceStatus.label} tone={attendanceStatus.tone} />
          </View>
          <Text style={styles.attendanceHint}>{attendanceHint}</Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  backLabel: {
    fontSize: typography.body,
    fontWeight: fontWeights.semibold,
    color: colors.link,
  },
  linkPressed: {
    textDecorationLine: 'underline',
  },
  meeting: {
    fontSize: typography.secondary,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.primary,
  },
  title: {
    marginTop: spacing.xs,
    fontSize: typography.screenTitle,
    lineHeight: lineHeights.screenTitle,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  badgeRow: {
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  cardTitle: {
    marginBottom: spacing.xs,
    fontSize: typography.bodyLarge,
    fontWeight: fontWeights.semibold,
    color: colors.text,
  },
  attendanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  attendanceLabel: {
    fontSize: typography.body,
    color: colors.textMuted,
  },
  attendanceHint: {
    marginTop: spacing.sm,
    fontSize: typography.body,
    lineHeight: lineHeights.body,
    color: colors.textMuted,
  },
  cta: {
    gap: spacing.sm,
  },
  reason: {
    fontSize: typography.body,
    lineHeight: lineHeights.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
