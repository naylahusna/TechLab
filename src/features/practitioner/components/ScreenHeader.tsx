import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '../../../components/Text';
import { colors, fontWeights, lineHeights, spacing, typography } from '../theme';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
};

export function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.screenTitle,
    lineHeight: lineHeights.screenTitle,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: typography.body,
    lineHeight: lineHeights.body,
    color: colors.textMuted,
  },
});
