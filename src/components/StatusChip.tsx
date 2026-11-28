import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '../theme/tokens';
import { Text } from './Text';

const palette = {
  neutral: { backgroundColor: colors.line, color: colors.muted },
  info: { backgroundColor: colors.paleBlue, color: colors.blue },
  success: { backgroundColor: colors.lime, color: colors.success },
  warning: { backgroundColor: colors.lavender, color: colors.navy },
  danger: { backgroundColor: colors.peach, color: colors.danger },
} as const;

export function StatusChip({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: keyof typeof palette;
}) {
  const { backgroundColor, color } = palette[tone];

  return (
    <View style={[styles.chip, { backgroundColor }]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  label: { fontSize: 12, fontWeight: '600' },
});
