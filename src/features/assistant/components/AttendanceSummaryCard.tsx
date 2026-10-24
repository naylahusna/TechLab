import { StyleSheet, View } from 'react-native';

import { Text } from '../../../components/Text';
import { colors, fontWeights, radius, spacing, typography } from '../theme';
import type { AttendanceSummary } from '../types';

type AttendanceSummaryCardProps = {
  summary: AttendanceSummary;
};

export function AttendanceSummaryCard({ summary }: AttendanceSummaryCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Ringkasan Kehadiran</Text>

      <View style={styles.metricsRow}>
        <View style={[styles.metricBox, styles.totalBox]}>
          <Text style={[styles.metricNumber, styles.totalNumber]}>
            {summary.total}
          </Text>
          <Text style={styles.metricLabel}>Total Peserta</Text>
        </View>

        <View style={[styles.metricBox, styles.presentBox]}>
          <Text style={[styles.metricNumber, styles.presentNumber]}>
            {summary.present}
          </Text>
          <Text style={styles.metricLabel}>Sudah Hadir</Text>
        </View>

        <View style={[styles.metricBox, styles.notPresentBox]}>
          <Text style={[styles.metricNumber, styles.notPresentNumber]}>
            {summary.notPresent}
          </Text>
          <Text style={styles.metricLabel}>Belum Hadir</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: fontWeights.semibold,
    color: colors.text,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  totalBox: {
    backgroundColor: colors.primarySoft,
  },
  presentBox: {
    backgroundColor: colors.successSoft,
  },
  notPresentBox: {
    backgroundColor: colors.dangerSoft,
  },
  metricNumber: {
    fontSize: 22,
    fontWeight: fontWeights.bold,
  },
  totalNumber: {
    color: colors.primary,
  },
  presentNumber: {
    color: colors.success,
  },
  notPresentNumber: {
    color: colors.danger,
  },
  metricLabel: {
    fontSize: typography.caption,
    fontWeight: fontWeights.medium,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
