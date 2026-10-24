import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '../theme/tokens';

type Props = { title: string; onPress: () => void; disabled?: boolean; secondary?: boolean; testID?: string };

export function ActionButton({ title, onPress, disabled = false, secondary = false, testID }: Props) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, secondary && styles.secondary, disabled && styles.disabled, pressed && styles.pressed]}
    >
      <Text style={[styles.label, secondary && styles.secondaryLabel, disabled && styles.disabledLabel]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { backgroundColor: colors.blue, borderRadius: 16, minHeight: 56, padding: 16, alignItems: 'center', justifyContent: 'center' },
  secondary: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  disabled: { backgroundColor: '#DBE2ED', borderColor: '#DBE2ED' },
  pressed: { opacity: 0.75 },
  label: { fontSize: 15, fontWeight: '700', color: colors.white, textAlign: 'center' },
  secondaryLabel: { color: colors.blue },
  disabledLabel: { color: '#5C6C82' },
});
