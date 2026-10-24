import { StyleSheet, View } from 'react-native';

import { Text } from '../../../components/Text';
import { colors, fontWeights, spacing, typography } from '../theme';

type InfoRowProps = {
  label: string;
  value: string;
  last?: boolean;
};

export function InfoRow({ label, value, last = false }: InfoRowProps) {
  return (
    <View style={[styles.row, last ? null : styles.border]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    flex: 1,
    fontSize: typography.body,
    color: colors.textMuted,
  },
  value: {
    flex: 1.4,
    fontSize: typography.body,
    fontWeight: fontWeights.semibold,
    color: colors.textBody,
    textAlign: 'right',
  },
});
