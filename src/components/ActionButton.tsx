import { Pressable, StyleSheet } from 'react-native';

import { colors } from '../theme/tokens';
import { Text } from './Text';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  danger?: boolean;
  testID?: string;
};

export function ActionButton({
  title,
  onPress,
  disabled = false,
  secondary = false,
  danger = false,
  testID,
}: Props) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        danger && styles.danger,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.label,
          secondary && styles.secondaryLabel,
          danger && styles.dangerLabel,
          disabled && styles.disabledLabel,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.blue,
    borderRadius: 22,
    minHeight: 56,
    padding: 16,
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
