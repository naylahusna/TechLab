import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderBack } from '../../../components/HeaderBack';
import { Text } from '../../../components/Text';
import { colors, fontWeights, lineHeights, spacing, typography } from '../theme';

type PracticumHeaderProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  onBack: () => void;
};

export function PracticumHeader({ title, subtitle, eyebrow, onBack }: PracticumHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
      <StatusBar style="light" />
      <View pointerEvents="none" style={styles.orb} />
      <View pointerEvents="none" style={styles.ring} />
      <HeaderBack onPress={onBack} />
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    gap: spacing.xs,
  },
  eyebrow: {
    color: colors.successSoft,
    fontSize: typography.caption,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.white,
    fontSize: typography.screenTitle,
    lineHeight: lineHeights.screenTitle,
    fontWeight: fontWeights.bold,
  },
  subtitle: {
    color: colors.onBlue,
    fontSize: typography.body,
    lineHeight: lineHeights.body,
  },
  orb: {
    position: 'absolute',
    width: 140,
    height: 140,
    right: -24,
    top: -55,
    borderRadius: 70,
    backgroundColor: '#EAFCAD22',
  },
  ring: {
    position: 'absolute',
    width: 220,
    height: 220,
    right: -60,
    top: -90,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: '#EAFCAD66',
  },
});
