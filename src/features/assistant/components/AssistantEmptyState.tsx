import { StyleSheet, View } from 'react-native';

import { Text } from '../../../components/Text';
import { colors, fontWeights, lineHeights, radius, spacing, typography } from '../theme';

export type EmptyStateKind = 'jadwal' | 'rekap' | 'peserta' | 'filter';

type AssistantEmptyStateProps = {
  kind: EmptyStateKind;
  customTitle?: string;
  customMessage?: string;
};

const EMPTY_STATE_CONFIG: Record<
  EmptyStateKind,
  { title: string; message: string; badge: string }
> = {
  jadwal: {
    title: 'Belum Ada Jadwal Penugasan',
    message: 'Saat ini belum ada sesi praktikum yang ditugaskan kepadamu.',
    badge: 'JADWAL KOSONG',
  },
  rekap: {
    title: 'Belum Ada Rekap Sesi',
    message: 'Rekap kehadiran akan tampil setelah ada sesi yang ditugaskan kepadamu.',
    badge: 'REKAP KOSONG',
  },
  peserta: {
    title: 'Belum Ada Peserta Terdaftar',
    message: 'Sesi praktikum ini belum memiliki praktikan yang terdaftar.',
    badge: 'PESERTA KOSONG',
  },
  filter: {
    title: 'Tidak Ada Peserta yang Cocok',
    message: 'Tidak ada peserta praktikum yang cocok dengan filter kehadiran ini.',
    badge: 'FILTER KOSONG',
  },
};

export function AssistantEmptyState({
  kind,
  customTitle,
  customMessage,
}: AssistantEmptyStateProps) {
  const config = EMPTY_STATE_CONFIG[kind];
  const title = customTitle ?? config.title;
  const message = customMessage ?? config.message;

  return (
    <View style={styles.container}>
      <View style={styles.badgeContainer}>
        <Text style={styles.badgeText}>{config.badge}</Text>
      </View>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  badgeContainer: {
    backgroundColor: colors.neutralSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    marginBottom: spacing.xs,
  },
  badgeText: {
    fontSize: typography.caption,
    fontWeight: fontWeights.bold,
    color: colors.neutral,
    letterSpacing: 0.8,
  },
  title: {
    fontSize: typography.bodyLarge,
    fontWeight: fontWeights.bold,
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.body,
    lineHeight: lineHeights.body,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 320,
  },
});
