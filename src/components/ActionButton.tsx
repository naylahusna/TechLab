import { Pressable, StyleSheet } from 'react-native';

import { colors } from '../theme/tokens';
import { Text } from './Text';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  testID?: string;
};

export function ActionButton({
  title,
  onPress,
  disabled = false,
  secondary = false,
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
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[styles.label, secondary && styles.secondaryLabel, disabled && styles.disabledLabel]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.navy,
    borderRadius: 22,
    minHeight: 56,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  disabled: { backgroundColor: colors.disabled, borderColor: colors.disabled },
  pressed: { opacity: 0.75 },
  label: { fontSize: 15, fontWeight: '700', color: colors.white, textAlign: 'center' },
  secondaryLabel: { color: colors.navy },
  disabledLabel: { color: colors.muted },
});
