/**
 * Token sementara untuk fitur praktikan.
 * Pindahkan ke theme bersama setelah design system tim disepakati.
 */
export const colors = {
  background: '#F5F7FB',
  surface: '#FFFFFF',
  surfaceMuted: '#F8FAFC',
  primary: '#2563EB',
  primaryPressed: '#1D4ED8',
  primarySoft: '#DBEAFE',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  success: '#15803D',
  successSoft: '#DCFCE7',
  successBorder: '#BBF7D0',
  successText: '#166534',
  warning: '#B45309',
  warningSoft: '#FEF3C7',
  danger: '#B91C1C',
  dangerSoft: '#FEE2E2',
  dangerBorder: '#FECACA',
  dangerText: '#991B1B',
  info: '#1D4ED8',
  infoSoft: '#DBEAFE',
  neutral: '#475569',
  neutralSoft: '#E2E8F0',
  white: '#FFFFFF',
  overlay: 'rgba(15, 23, 42, 0.45)',
  shadow: '#0F172A',
  disabled: '#CBD5E1',
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
  body: 14,
  bodyLarge: 16,
  title: 20,
  screenTitle: 24,
} as const;
