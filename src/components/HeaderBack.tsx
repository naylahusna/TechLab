import { Pressable, StyleSheet } from 'react-native';
import { colors, controls, spacing } from '../theme/tokens';
import { Text } from './Text';

export function HeaderBack({ onPress }: { onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel="Kembali" onPress={onPress}
    style={({ pressed }) => [styles.control, pressed && styles.pressed]}>
    <Text style={styles.label}>← Kembali</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  control: { alignSelf: 'flex-start', minHeight: controls.touchHeight, justifyContent: 'center', paddingRight: spacing.md },
  pressed: { opacity: 0.7 },
  label: { color: colors.white, fontSize: 14, fontWeight: '700' },
});
