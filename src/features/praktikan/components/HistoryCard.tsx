import { StyleSheet, Text, View } from 'react-native';
import { ATTENDANCE_STATUS_META } from '../lib/status';
import { colors, radius, spacing, typography } from '../theme';
import type { RiwayatItem } from '../types';
import { Badge } from './Badge';

type HistoryCardProps = {
  item: RiwayatItem;
};

function getTimeLabel(item: RiwayatItem): string {
  if (item.attendedAtLabel) {
    return `Hadir pukul ${item.attendedAtLabel}`;
  }

  return item.status === 'tidak-hadir' ? 'Tidak hadir' : 'Belum ada waktu kehadiran';
}

export function HistoryCard({ item }: HistoryCardProps) {
  const status = ATTENDANCE_STATUS_META[item.status];
  const timeLabel = getTimeLabel(item);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Text style={styles.title} numberOfLines={2}>
            {item.practicalName}
          </Text>
          <Text style={styles.meeting}>{item.meetingLabel}</Text>
        </View>
        <Badge label={status.label} tone={status.tone} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.date}>{item.dateLabel}</Text>
        <Text style={item.attendedAtLabel ? styles.time : styles.timeMuted}>{timeLabel}</Text>
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
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  titleGroup: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: colors.text,
  },
  meeting: {
    fontSize: typography.caption,
    color: colors.textMuted,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceMuted,
  },
  date: {
    flex: 1,
    fontSize: typography.body,
    color: colors.textMuted,
  },
  time: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  timeMuted: {
    fontSize: typography.body,
    color: colors.textMuted,
  },
});
