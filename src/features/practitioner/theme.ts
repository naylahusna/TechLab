import { colors as sharedColors } from '../../theme/tokens';

/**
 * Alias semantik untuk token bersama di src/theme.
 * Jangan menambah warna baru di sini tanpa koordinasi dengan owner theme.
 */
export const colors = {
  background: sharedColors.background,
  surface: sharedColors.white,
  surfaceMuted: sharedColors.background,
  primary: sharedColors.blue,
  primaryPressed: sharedColors.blue,
  primaryBackground: sharedColors.paleBlue,
  primarySoft: sharedColors.paleBlue,
  border: sharedColors.line,
  borderHighlight: sharedColors.paleBlue,
  text: sharedColors.navy,
  textBody: sharedColors.navy,
  textMuted: sharedColors.muted,
  link: sharedColors.blue,
  success: sharedColors.success,
  successSoft: sharedColors.lime,
  successBorder: sharedColors.lime,
  successText: sharedColors.success,
  warning: sharedColors.navy,
  warningSoft: sharedColors.lavender,
  danger: sharedColors.danger,
  dangerSoft: sharedColors.peach,
  dangerBorder: sharedColors.peach,
  dangerText: sharedColors.danger,
  info: sharedColors.blue,
  infoSoft: sharedColors.paleBlue,
  neutral: sharedColors.muted,
  neutralSoft: sharedColors.line,
  white: sharedColors.white,
  onBlue: sharedColors.onBlue,
  heroOrb: 'rgba(255, 255, 255, 0.08)',
  heroRing: 'rgba(255, 255, 255, 0.16)',
  heroGlass: 'rgba(255, 255, 255, 0.16)',
  heroLime: 'rgba(234, 252, 173, 0.18)',
  overlay: 'rgba(32, 37, 31, 0.45)',
  shadow: sharedColors.navy,
  disabled: sharedColors.disabled,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  caption: 12,
  secondary: 13,
  body: 14,
  bodyLarge: 16,
  title: 20,
  screenTitle: 24,
} as const;

export const lineHeights = {
  caption: 16,
  body: 20,
  bodyLarge: 22,
  title: 28,
  screenTitle: 32,
} as const;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;
