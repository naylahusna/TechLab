import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { Text } from '../../../components/Text';
import { colors, fontWeights, radius, spacing, typography } from '../theme';

type AssistantButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'danger' | 'secondary';
  testID?: string;
};

export function AssistantButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  testID,
}: AssistantButtonProps) {
  const isDanger = variant === 'danger';
  const isSecondary = variant === 'secondary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        isSecondary ? styles.secondary : isDanger ? styles.danger : styles.primary,
        disabled && styles.disabled,
        pressed && !disabled && (isSecondary ? styles.secondaryPressed : styles.pressed),
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={isSecondary ? colors.text : colors.white}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.label,
            isSecondary && styles.secondaryLabel,
            disabled && styles.disabledLabel,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: {
    backgroundColor: colors.disabled,
    borderColor: colors.disabled,
  },
  pressed: {
    opacity: 0.85,
  },
  secondaryPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  label: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: fontWeights.bold,
  },
  secondaryLabel: {
    color: colors.text,
  },
  disabledLabel: {
    color: colors.textMuted,
  },
});
