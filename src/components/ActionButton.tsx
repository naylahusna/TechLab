import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { colors, controls, radius, spacing } from '../theme/tokens';
import { Text } from './Text';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  secondary?: boolean;
  danger?: boolean;
  testID?: string;
};

export function ActionButton({
  title,
  onPress,
  disabled = false,
  busy = false,
  secondary = false,
  danger = false,
  testID,
}: Props) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        danger && styles.danger,
        (disabled || busy) && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {busy ? <ActivityIndicator color={colors.navy} /> : <Text
        style={[
          styles.label,
          secondary && styles.secondaryLabel,
          danger && styles.dangerLabel,
          disabled && styles.disabledLabel,
        ]}
      >
        {title}
      </Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.blue,
    borderRadius: radius.xl,
    minHeight: controls.actionHeight,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: { backgroundColor: colors.lime, borderWidth: 1, borderColor: '#DBEEA0' },
  danger: { backgroundColor: colors.danger, borderWidth: 1, borderColor: colors.danger },
  disabled: { backgroundColor: colors.disabled, borderColor: colors.disabled },
  pressed: { opacity: 0.75 },
  label: { fontSize: 15, fontWeight: '700', color: colors.white, textAlign: 'center' },
  secondaryLabel: { color: colors.navy },
  dangerLabel: { color: colors.white },
  disabledLabel: { color: colors.muted },
});
