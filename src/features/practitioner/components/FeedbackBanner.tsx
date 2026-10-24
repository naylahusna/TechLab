import { StyleSheet, View } from 'react-native';

import { Text } from '../../../components/Text';
import { colors, fontWeights, lineHeights, radius, spacing, typography } from '../theme';

type FeedbackTone = 'success' | 'error';

type FeedbackBannerProps = {
  tone: FeedbackTone;
  title: string;
  message: string;
};

const TONE: Record<
  FeedbackTone,
  { background: string; border: string; title: string; message: string }
> = {
  success: {
    background: colors.successSoft,
    border: colors.successBorder,
    title: colors.success,
    message: colors.successText,
  },
  error: {
    background: colors.dangerSoft,
    border: colors.dangerBorder,
    title: colors.danger,
    message: colors.dangerText,
  },
};

export function FeedbackBanner({ tone, title, message }: FeedbackBannerProps) {
  const palette = TONE[tone];

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[
        styles.container,
        { backgroundColor: palette.background, borderColor: palette.border },
      ]}
    >
      <Text style={[styles.title, { color: palette.title }]}>{title}</Text>
      <Text style={[styles.message, { color: palette.message }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  title: {
    fontSize: typography.body,
    fontWeight: fontWeights.semibold,
  },
  message: {
    marginTop: spacing.xs,
    fontSize: typography.body,
    lineHeight: lineHeights.body,
  },
});
