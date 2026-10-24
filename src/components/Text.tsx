import { isLoaded } from 'expo-font';
import { StyleSheet, Text as NativeText, type TextProps } from 'react-native';

import { typography } from '../theme/tokens';

/** One rounded typeface for feature screens, preserving native Text props and scaling. */
export function Text({ style, ...props }: TextProps) {
  return <NativeText {...props} style={[isLoaded(typography.family) && styles.text, style]} />;
}

const styles = StyleSheet.create({ text: { fontFamily: typography.family } });
