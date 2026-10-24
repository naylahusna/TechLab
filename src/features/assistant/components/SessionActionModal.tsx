import { Modal, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '../../../components/Text';
import { colors, fontWeights, lineHeights, radius, spacing, typography } from '../theme';
import { AssistantButton } from './AssistantButton';

type SessionActionModalProps = {
  visible: boolean;
  action: 'open' | 'close';
  sessionName: string;
  meetingLabel: string;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function SessionActionModal({
  visible,
  action,
  sessionName,
  meetingLabel,
  isSubmitting = false,
  errorMessage = null,
  onConfirm,
  onCancel,
}: SessionActionModalProps) {
  const isOpen = action === 'open';

  const title = isOpen ? 'Buka Sesi Praktikum?' : 'Tutup Sesi Praktikum?';
  const description = isOpen
    ? `Sesi ${meetingLabel} (${sessionName}) akan dibuka. Praktikan yang terdaftar dapat mulai melakukan presensi.`
    : `Sesi ${meetingLabel} (${sessionName}) akan ditutup. Presensi baru tidak dapat dilakukan lagi dan peserta yang belum hadir akan berstatus Tidak Hadir.`;

  const confirmLabel = isOpen ? 'Buka Sesi Sekarang' : 'Tutup Sesi Sekarang';
  const badgeLabel = isOpen ? 'KONFIRMASI BUKA SESI' : 'KONFIRMASI TUTUP SESI';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View accessibilityViewIsModal style={styles.dialog}>
          <ScrollView contentContainerStyle={styles.sheet} bounces={false}>
            <View style={[styles.badge, isOpen ? styles.badgeOpen : styles.badgeClose]}>
              <Text
                style={[
                  styles.badgeText,
                  isOpen ? styles.badgeTextOpen : styles.badgeTextClose,
                ]}
              >
                {badgeLabel}
              </Text>
            </View>

            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>

            <Text style={styles.description}>{description}</Text>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <View style={styles.actions}>
              <AssistantButton
                label={confirmLabel}
                variant={isOpen ? 'primary' : 'danger'}
                onPress={onConfirm}
                loading={isSubmitting}
                disabled={isSubmitting}
                testID="confirm-session-action"
              />
              <AssistantButton
                label="Batal"
                variant="secondary"
                onPress={onCancel}
                disabled={isSubmitting}
                testID="cancel-session-action"
              />
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  sheet: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  badgeOpen: {
    backgroundColor: colors.primarySoft,
  },
  badgeClose: {
    backgroundColor: colors.dangerSoft,
  },
  badgeText: {
    fontSize: typography.caption,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.8,
  },
  badgeTextOpen: {
    color: colors.primary,
  },
  badgeTextClose: {
    color: colors.danger,
  },
  title: {
    fontSize: typography.title,
    fontWeight: fontWeights.bold,
    color: colors.text,
    lineHeight: lineHeights.title,
  },
  description: {
    fontSize: typography.body,
    lineHeight: lineHeights.body,
    color: colors.textMuted,
  },
  errorBox: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  errorText: {
    fontSize: typography.secondary,
    color: colors.danger,
    lineHeight: lineHeights.body,
    fontWeight: fontWeights.medium,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
