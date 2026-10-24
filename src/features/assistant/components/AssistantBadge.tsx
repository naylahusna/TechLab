import { StyleSheet, View } from 'react-native';

import { Text } from '../../../components/Text';
import { colors, fontWeights, radius, spacing, typography } from '../theme';
import type { AssistantBadgeTone } from '../types';

const TONE: Record<AssistantBadgeTone, { backgroundColor: string; color: string }> = {
  neutral: { backgroundColor: colors.neutralSoft, color: colors.neutral },
  info: { backgroundColor: colors.primarySoft, color: colors.primary },
  success: { backgroundColor: colors.successSoft, color: colors.success },
  warning: { backgroundColor: colors.warningSoft, color: colors.warning },
  danger: { backgroundColor: colors.dangerSoft, color: colors.danger },
};

type AssistantBadgeProps = {
  label: string;
  tone?: AssistantBadgeTone;
};

export function AssistantBadge({ label, tone = 'neutral' }: AssistantBadgeProps) {
  const palette = TONE[tone];

  return (
    <View style={[styles.badge, { backgroundColor: palette.backgroundColor }]}>
      <Text style={[styles.label, { color: palette.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  label: {
    fontSize: typography.caption,
    fontWeight: fontWeights.semibold,
  },
});
