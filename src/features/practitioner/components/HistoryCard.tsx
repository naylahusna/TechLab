import { StyleSheet, View } from 'react-native';

import { Text } from '../../../components/Text';
import { ATTENDANCE_STATUS_META } from '../lib/status';
import { colors, fontWeights, radius, spacing, typography } from '../theme';
import type { RiwayatItem } from '../types';
import { Badge } from './Badge';

type HistoryCardProps = {
  item: RiwayatItem;
};

function getAttendanceLabel(item: RiwayatItem): string {
  if (item.status === 'izin') return 'Izin disetujui asisten';
  if (item.status === 'izin-menunggu') return 'Menunggu keputusan asisten';
  if (item.attendedAtLabel) {
    if (item.attendedAtDateLabel && item.attendedAtDateLabel !== item.dateLabel) {
      return `Hadir ${item.attendedAtDateLabel} pukul ${item.attendedAtLabel}`;
    }

    return `Hadir pukul ${item.attendedAtLabel}`;
  }

  return item.status === 'tidak-hadir' ? 'Tidak hadir' : 'Belum ada waktu kehadiran';
}

export function HistoryCard({ item }: HistoryCardProps) {
  const status = ATTENDANCE_STATUS_META[item.status];
  const attendanceLabel = getAttendanceLabel(item);
  const isApproved = item.status === 'hadir' || item.status === 'izin';
  const isPending = item.status === 'izin-menunggu';
  const markStyle = isApproved
    ? styles.markPresent
    : isPending
      ? styles.markPending
      : styles.markAbsent;
  const markTextStyle = isApproved
    ? styles.markPresentText
    : isPending
      ? styles.markPendingText
      : styles.markAbsentText;
  const markIcon = isApproved ? '✓' : isPending ? '◷' : '!';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.identity}>
          <View
            style={[styles.mark, markStyle]}
            accessible={false}
            importantForAccessibility="no-hide-descendants"
          >
            <Text
              style={[styles.markText, markTextStyle]}
            >
              {markIcon}
            </Text>
          </View>

          <View style={styles.titleGroup}>
            <Text style={styles.title} numberOfLines={2}>
              {item.practicalName}
            </Text>
            <Text style={styles.meeting}>{item.meetingLabel}</Text>
          </View>
        </View>

        <Badge label={status.label} tone={status.tone} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.date}>{item.dateLabel}</Text>
        <Text style={item.attendedAtLabel ? styles.time : styles.timeMuted}>{attendanceLabel}</Text>
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
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  identity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  mark: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markPresent: {
    backgroundColor: colors.successSoft,
  },
  markAbsent: {
    backgroundColor: colors.dangerSoft,
  },
  markPending: {
    backgroundColor: colors.infoSoft,
  },
  markText: {
    fontSize: typography.bodyLarge,
    fontWeight: fontWeights.bold,
  },
  markPresentText: {
    color: colors.success,
  },
  markAbsentText: {
    color: colors.danger,
  },
  markPendingText: {
    color: colors.info,
  },
  titleGroup: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: typography.bodyLarge,
    fontWeight: fontWeights.semibold,
    color: colors.text,
  },
  meeting: {
    fontSize: typography.secondary,
    color: colors.textMuted,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  date: {
    flex: 1,
    fontSize: typography.secondary,
    color: colors.textMuted,
  },
  time: {
    fontSize: typography.secondary,
    fontWeight: fontWeights.semibold,
    color: colors.textBody,
  },
  timeMuted: {
    fontSize: typography.secondary,
    color: colors.textMuted,
  },
});
