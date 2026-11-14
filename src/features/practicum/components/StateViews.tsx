import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '../../../components/Text';
import { colors, fontWeights, lineHeights, radius, spacing, typography } from '../theme';

export function LoadingState({ message = 'Memuat data…' }: { message?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.muted}>{message}</Text>
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.card}>
      <Text accessibilityRole="alert" style={styles.errorTitle}>
        Tidak dapat memuat data
      </Text>
      <Text style={styles.muted}>{message}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={({ pressed }) => [styles.action, pressed && styles.pressed]}
      >
        <Text style={styles.actionLabel}>Coba lagi</Text>
      </Pressable>
    </View>
  );
}

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <Text accessibilityRole="header" style={styles.emptyTitle}>
        {title}
      </Text>
      <Text style={styles.muted}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.md,
  },
  muted: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: lineHeights.body,
    textAlign: 'center',
  },
  card: {
    margin: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.dangerSoft,
    backgroundColor: colors.surface,
    gap: spacing.sm,
    alignItems: 'center',
  },
  errorTitle: {
    color: colors.danger,
    fontSize: typography.bodyLarge,
    fontWeight: fontWeights.bold,
  },
  empty: {
    margin: spacing.lg,
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.bodyLarge,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
  },
  action: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  pressed: { opacity: 0.8 },
  actionLabel: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: fontWeights.bold,
  },
});
