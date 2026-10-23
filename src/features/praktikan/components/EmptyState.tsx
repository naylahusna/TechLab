import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

type EmptyStateProps = {
  title: string;
  message: string;
};

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.icon} accessibilityElementsHidden importantForAccessibility="no">
        <View style={styles.iconLine} />
        <View style={[styles.iconLine, styles.iconLineShort]} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: spacing.md,
  },
  iconLine: {
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  iconLineShort: {
    width: 12,
  },
  title: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    marginTop: spacing.xs,
    fontSize: typography.body,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
