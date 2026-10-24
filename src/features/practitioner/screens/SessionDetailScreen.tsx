import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '../../../components/Text';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { ConfirmAttendanceSheet } from '../components/ConfirmAttendanceSheet';
import { FeedbackBanner } from '../components/FeedbackBanner';
import { InfoRow } from '../components/InfoRow';
import { getAttendanceAction } from '../lib/attendance-action';
import { ATTENDANCE_STATUS_META, SESSION_STATUS_META } from '../lib/status';
import { colors, fontWeights, lineHeights, radius, spacing, typography } from '../theme';
import type {
  AttendanceActionResult,
  AttendanceInfo,
  PraktikanIdentity,
  SessionDetail,
} from '../types';

type SessionDetailScreenProps = {
  session: SessionDetail;
  praktikan: PraktikanIdentity;
  onBack: () => void;
  onConfirmAttendance: () => AttendanceActionResult | Promise<AttendanceActionResult>;
};

type SuccessInfo = {
  attendedAtLabel: string;
};

function resolveAttendance(
  attendance: AttendanceInfo,
  success: SuccessInfo | null,
): AttendanceInfo {
  if (attendance.status === 'hadir') {
    return attendance;
  }

  if (success) {
    return { status: 'hadir', attendedAtLabel: success.attendedAtLabel };
  }

  return attendance;
}

function getAttendanceHint(attendance: AttendanceInfo): string {
  if (attendance.status === 'hadir' && attendance.attendedAtLabel) {
    return `Tercatat hadir pukul ${attendance.attendedAtLabel}.`;
  }

  if (attendance.status === 'tidak-hadir') {
    return 'Sesi telah ditutup dan tidak ada catatan kehadiran untukmu.';
  }

  return 'Kehadiran belum tercatat pada sesi ini.';
}

export function SessionDetailScreen(props: SessionDetailScreenProps) {
  // Key membuat state lokal (modal, error, feedback) ikut reset saat sesi berganti.
  return <SessionDetailContent key={props.session.id} {...props} />;
}

function SessionDetailContent({
  session,
  praktikan,
  onBack,
  onConfirmAttendance,
}: SessionDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessInfo | null>(null);
  const submittingRef = useRef(false);

  const effectiveAttendance = resolveAttendance(session.myAttendance, success);

  const sessionStatus = SESSION_STATUS_META[session.status];
  const attendanceStatus = ATTENDANCE_STATUS_META[effectiveAttendance.status];
  const attendanceAction = getAttendanceAction(session.status, effectiveAttendance.status);

  function handleBack() {
    if (!submittingRef.current) {
      onBack();
    }
  }

  function handleOpenConfirm() {
    if (attendanceAction.disabled) {
      return;
    }

    setSubmitError(null);
    setConfirmVisible(true);
  }

  function handleCancel() {
    if (!submittingRef.current) {
      setConfirmVisible(false);
      setSubmitError(null);
    }
  }

  async function handleConfirm() {
    if (submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await onConfirmAttendance();

      if (result.ok) {
        setSuccess({ attendedAtLabel: result.attendedAtLabel });
        setConfirmVisible(false);
      } else {
        setSubmitError(result.reason);
      }
    } catch {
      setSubmitError('Presensi gagal dicatat. Silakan coba lagi.');
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  const attendanceHint = getAttendanceHint(effectiveAttendance);

  return (
    <>
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

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informasi Sesi</Text>
          <InfoRow label="Kelas" value={session.className} />
          <InfoRow label="Lab" value={session.lab} />
          <InfoRow label="Tanggal" value={session.dateLabel} />
          <InfoRow label="Waktu" value={session.timeLabel} />
          <InfoRow label="Status Sesi" value={sessionStatus.label} last />
        </View>

        {success ? (
          <FeedbackBanner
            tone="success"
            title="Presensi berhasil"
            message={`Kehadiranmu tercatat pukul ${success.attendedAtLabel}.`}
          />
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Presensi Kamu</Text>
          <View style={styles.attendanceRow}>
            <Text style={styles.attendanceLabel}>Status</Text>
            <Badge label={attendanceStatus.label} tone={attendanceStatus.tone} />
          </View>
          <Text style={styles.attendanceHint}>{attendanceHint}</Text>
        </View>

        <View style={styles.cta}>
          <Button
            label={attendanceAction.label}
            onPress={handleOpenConfirm}
            disabled={attendanceAction.disabled}
          />
          {attendanceAction.reason ? (
            <Text style={styles.reason}>{attendanceAction.reason}</Text>
          ) : null}
        </View>
      </ScrollView>

      <ConfirmAttendanceSheet
        visible={confirmVisible}
        praktikan={praktikan}
        session={session}
        isSubmitting={isSubmitting}
        errorMessage={submitError}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
      />
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
