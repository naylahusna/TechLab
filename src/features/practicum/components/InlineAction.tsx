import { Pressable, StyleSheet } from 'react-native';

import { Text } from '../../../components/Text';
import { colors, fontWeights, radius, spacing, typography } from '../theme';

type InlineActionProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'lime';
  disabled?: boolean;
  large?: boolean;
};

export function InlineAction({
  label,
  onPress,
  variant = 'secondary',
  disabled = false,
  large = false,
}: InlineActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary'
          ? styles.primary
          : variant === 'danger'
            ? styles.danger
            : variant === 'lime'
              ? styles.lime
              : styles.secondary,
        large && styles.large,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.label,
          variant === 'primary'
            ? styles.primaryLabel
            : variant === 'danger'
              ? styles.dangerLabel
              : variant === 'lime'
                ? styles.limeLabel
                : styles.secondaryLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 36,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  primary: { backgroundColor: colors.primary, borderColor: colors.primary },
  secondary: { backgroundColor: colors.surface, borderColor: colors.border },
  danger: { backgroundColor: colors.surface, borderColor: colors.danger },
  lime: { backgroundColor: colors.successSoft, borderColor: '#CFE685' },
  large: {
    flex: 1,
    minHeight: 56,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.8 },
  label: { fontSize: typography.caption, fontWeight: fontWeights.bold },
  primaryLabel: { color: colors.white },
  secondaryLabel: { color: colors.text },
  dangerLabel: { color: colors.danger },
  limeLabel: { color: colors.text },
});
