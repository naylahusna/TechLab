import { StatusBar } from 'expo-status-bar';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '../../../components/Text';
import { colors, fontWeights, lineHeights, radius, spacing, typography } from '../theme';
import type { PraktikanIdentity, SessionDetail } from '../types';
import { Button } from './Button';
import { FeedbackBanner } from './FeedbackBanner';
import { InfoRow } from './InfoRow';

type ConfirmAttendanceSheetProps = {
  visible: boolean;
  praktikan: PraktikanIdentity;
  session: SessionDetail;
  isSubmitting: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Bottom sheet konfirmasi presensi (SRS-13).
 * Kehadiran hanya dicatat setelah pengguna menekan tombol konfirmasi.
 */
export function ConfirmAttendanceSheet({
  visible,
  praktikan,
  session,
  isSubmitting,
  errorMessage,
  onCancel,
  onConfirm,
}: ConfirmAttendanceSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      {visible ? <StatusBar style="light" /> : null}
      <View style={styles.overlay}>
        <View style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.handle} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.content,
              { paddingBottom: Math.max(insets.bottom, spacing.xxxl) },
            ]}
          >
            <View>
              <Text style={styles.title}>Konfirmasi Presensi</Text>
              <Text style={styles.subtitle}>
                Periksa identitas dan sesi sebelum mencatat kehadiran.
              </Text>
            </View>

            <View>
              <Text style={styles.sectionTitle}>Identitas</Text>
              <InfoRow label="Nama" value={praktikan.name} />
              <InfoRow label="NIM" value={praktikan.nim} last />
            </View>

            <View>
              <Text style={styles.sectionTitle}>Sesi</Text>
              <InfoRow label="Praktikum" value={session.practicalName} />
              <InfoRow label="Pertemuan" value={session.meetingLabel} />
              <InfoRow label="Kelas" value={session.className} />
              <InfoRow label="Lab" value={session.lab} />
              <InfoRow label="Tanggal" value={session.dateLabel} />
              <InfoRow label="Waktu" value={session.timeRangeLabel} last />
            </View>

            {errorMessage ? (
              <FeedbackBanner tone="error" title="Presensi gagal" message={errorMessage} />
            ) : null}

            <View style={styles.actions}>
              <View style={styles.actionItem}>
                <Button
                  label="Batal"
                  variant="secondary"
                  onPress={onCancel}
                  disabled={isSubmitting}
                />
              </View>
              <View style={styles.actionItem}>
                <Button
                  label={isSubmitting ? 'Mencatat...' : 'Ya, Catat Presensi'}
                  onPress={onConfirm}
                  loading={isSubmitting}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '92%',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  title: {
    fontSize: typography.screenTitle,
    lineHeight: lineHeights.screenTitle,
    fontWeight: fontWeights.bold,
    color: colors.text,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: typography.body,
    lineHeight: lineHeights.body,
    color: colors.textMuted,
  },
  sectionTitle: {
    marginBottom: spacing.xs,
    fontSize: typography.caption,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionItem: {
    flex: 1,
  },
});
