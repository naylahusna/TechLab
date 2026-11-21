import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
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
import { colors, fontWeights, radius, spacing, typography } from '../theme';
import type { AttendanceActionResult, PraktikanIdentity, SessionDetail } from '../types';
import type { LocationValidation } from '../lib/location-validation';

type AttendanceScreenProps = {
  session: SessionDetail;
  praktikan: PraktikanIdentity;
  locationValidation: LocationValidation;
  onBack: () => void;
  onConfirmAttendance: () => AttendanceActionResult | Promise<AttendanceActionResult>;
};

export function AttendanceScreen({
  session,
  praktikan,
  locationValidation,
  onBack,
  onConfirmAttendance,
}: AttendanceScreenProps) {
  const insets = useSafeAreaInsets();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);
  const [now, setNow] = useState(Date.now);
  const submittingRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(timer);
  }, []);

  const attendance = succeeded && session.myAttendance.status !== 'hadir'
    ? { ...session.myAttendance, status: 'hadir' as const }
    : session.myAttendance;
  const sessionStatus = SESSION_STATUS_META[session.status];
  const attendanceStatus = ATTENDANCE_STATUS_META[attendance.status];
  const attendanceAction = getAttendanceAction(
    session.status,
    attendance.status,
    session.startsAt,
    session.endsAt,
    now,
  );

  async function confirmAttendance() {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await onConfirmAttendance();
      if (result.ok) {
        setSucceeded(true);
        setConfirmVisible(false);
      } else {
        setSubmitError(result.reason);
      }
    } catch {
      setSubmitError('Presensi gagal dicatat. Silakan coba lagi.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  const attendedAt = attendance.attendedAtDateLabel && attendance.attendedAtLabel
    ? `${attendance.attendedAtDateLabel} pukul ${attendance.attendedAtLabel}`
    : attendance.attendedAtLabel ? `pukul ${attendance.attendedAtLabel}` : null;

  return (
    <>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { paddingTop: insets.top + spacing.md }]}>
          <Pressable accessibilityRole="button" onPress={onBack} style={styles.backLink}>
            <Text style={styles.backText}>‹  Kembali ke jadwal</Text>
          </Pressable>
          <Text style={styles.eyebrow}>PRESENSI PRAKTIKUM</Text>
          <Text accessibilityRole="header" style={styles.title}>Presensi</Text>
          <Text style={styles.subtitle}>{session.practicalName}</Text>
          <Text style={styles.meeting}>{session.meetingLabel} · {session.className}</Text>
          <View style={styles.heroStatus}>
            <View style={[styles.statusDot, session.status === 'dibuka' && styles.statusDotOpen]} />
            <Text style={styles.heroStatusText}>Sesi {sessionStatus.label}</Text>
          </View>
          <View pointerEvents="none" style={styles.heroOrb} />
          <View pointerEvents="none" style={styles.heroRing} />
        </View>

        <View style={styles.main}>
          <View style={styles.card}>
            <Text style={styles.cardEyebrow}>SESI YANG KAMU IKUTI</Text>
            <Text style={styles.cardTitle}>Informasi Sesi</Text>
            <InfoRow label="Laboratorium" value={session.lab || 'Belum ditentukan'} />
            <InfoRow label="Tanggal" value={session.dateLabel} />
            <InfoRow label="Waktu pelaksanaan" value={session.timeRangeLabel} last />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardEyebrow}>STATUS KEHADIRAN</Text>
            <View style={styles.attendanceStatusRow}>
              <View style={styles.attendanceIcon}><Text style={styles.attendanceIconText}>✓</Text></View>
              <View style={styles.attendanceCopy}>
                <Text style={styles.cardTitle}>Presensi Kamu</Text>
                {attendedAt ? <Text style={styles.note}>Tercatat {attendedAt}</Text> : <Text style={styles.note}>Status diperbarui mengikuti sesi.</Text>}
              </View>
              <Badge label={attendanceStatus.label} tone={attendanceStatus.tone} />
            </View>
          </View>

          <FeedbackBanner
            tone={locationValidation.status === 'inside' ? 'success' : 'error'}
            title={locationValidation.status === 'inside' ? 'Lokasi sesuai radius' : 'Lokasi tidak sesuai radius'}
            message={locationValidation.message}
          />

          {succeeded ? (
            <FeedbackBanner tone="success" title="Presensi berhasil" message="Kehadiranmu sudah tercatat untuk sesi ini." />
          ) : null}

          <View style={styles.actionBlock}>
            <Button
              label={attendanceAction.label}
              disabled={attendanceAction.disabled || locationValidation.status !== 'inside'}
              onPress={() => { setSubmitError(null); setConfirmVisible(true); }}
            />
            {attendanceAction.reason ? <Text style={styles.reason}>{attendanceAction.reason}</Text> : null}
          </View>
        </View>
      </ScrollView>
      <ConfirmAttendanceSheet
        visible={confirmVisible}
        praktikan={praktikan}
        session={session}
        locationValidation={locationValidation}
        isSubmitting={submitting}
        errorMessage={submitError}
        onCancel={() => { if (!submittingRef.current) { setConfirmVisible(false); setSubmitError(null); } }}
        onConfirm={() => { void confirmAttendance(); }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', paddingBottom: spacing.xl },
  hero: { position: 'relative', overflow: 'hidden', backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.xs, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  backLink: { alignSelf: 'flex-start', paddingVertical: spacing.sm, paddingRight: spacing.md, marginBottom: spacing.md, zIndex: 1 },
  backText: { color: colors.white, fontSize: typography.body, fontWeight: fontWeights.semibold },
  eyebrow: { color: colors.successSoft, fontSize: typography.caption, fontWeight: fontWeights.bold, letterSpacing: 1 },
  title: { color: colors.white, fontSize: 30, lineHeight: 38, fontWeight: fontWeights.bold },
  subtitle: { color: colors.white, fontSize: typography.bodyLarge, fontWeight: fontWeights.semibold },
  meeting: { color: colors.onBlue, fontSize: typography.secondary },
  heroStatus: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.16)' },
  heroStatusText: { color: colors.white, fontSize: typography.caption, fontWeight: fontWeights.semibold },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.white },
  statusDotOpen: { backgroundColor: colors.successSoft },
  heroOrb: { position: 'absolute', width: 150, height: 150, borderRadius: 75, top: -44, right: -35, backgroundColor: 'rgba(255,255,255,0.08)' },
  heroRing: { position: 'absolute', width: 190, height: 190, borderRadius: 95, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', top: 16, right: -68 },
  main: { paddingHorizontal: spacing.lg, marginTop: -spacing.md, gap: spacing.md },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.xs },
  cardEyebrow: { color: colors.primary, fontSize: typography.caption, fontWeight: fontWeights.bold, letterSpacing: 0.8 },
  cardTitle: { color: colors.text, fontSize: typography.bodyLarge, fontWeight: fontWeights.semibold },
  attendanceStatusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingTop: spacing.xs },
  attendanceIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  attendanceIconText: { color: colors.primary, fontSize: typography.bodyLarge, fontWeight: fontWeights.bold },
  attendanceCopy: { flex: 1, gap: 2 },
  note: { color: colors.textMuted, fontSize: typography.caption, lineHeight: 18 },
  actionBlock: { gap: spacing.sm, paddingTop: spacing.xs },
  reason: { color: colors.textMuted, fontSize: typography.caption, textAlign: 'center', lineHeight: 20 },
});
