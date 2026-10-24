import { StyleSheet, View } from 'react-native';

import { TabIcon } from '../../../components/TabIcon';
import { Text } from '../../../components/Text';
import { colors, fontWeights, lineHeights, radius, spacing, typography } from '../theme';

type EmptyStateProps = {
  title: string;
  message: string;
  icon?: 'jadwal' | 'catatan';
};

export function EmptyState({ title, message, icon = 'jadwal' }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View
        style={[styles.icon, icon === 'catatan' ? styles.iconHistory : null]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <TabIcon kind={icon} color={colors.primary} />
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
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  iconHistory: {
    backgroundColor: colors.warningSoft,
  },
  title: {
    fontSize: typography.bodyLarge,
    fontWeight: fontWeights.semibold,
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    marginTop: spacing.xs,
    fontSize: typography.body,
    lineHeight: lineHeights.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
