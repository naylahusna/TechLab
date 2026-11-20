import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '../../../components/Text';
import { SESSION_STATUS_META } from '../lib/status';
import { colors, fontWeights, radius, spacing, typography } from '../theme';
import type { SessionListItem } from '../types';
import { Badge } from './Badge';

type SessionCardProps = {
  session: SessionListItem;
  onOpenAttendance: () => void;
  onOpenDetails: () => void;
};

export function SessionCard({ session, onOpenAttendance, onOpenDetails }: SessionCardProps) {
  const status = SESSION_STATUS_META[session.status];
  const isOpen = session.status === 'dibuka';

  return (
    <View style={[styles.card, isOpen && styles.cardHighlight]}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Text style={styles.meeting}>{session.meetingLabel}</Text>
          <Text style={styles.title} numberOfLines={2}>{session.practicalName}</Text>
        </View>
        <Badge label={status.label} tone={status.tone} />
      </View>

      <Text style={styles.meta}>{session.className} · {session.lab}</Text>

      <View style={styles.footer}>
        <Text style={styles.date}>{session.dateLabel}</Text>
        <Text style={styles.time}>{session.timeRangeLabel}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Buka presensi ${session.practicalName}`}
          onPress={onOpenAttendance}
          style={({ pressed }) => [styles.attendanceButton, pressed && styles.pressed]}
        >
          <Text style={styles.attendanceLabel}>Buka presensi</Text>
          <Text style={styles.attendanceArrow}>→</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Lihat detail ${session.practicalName}`}
          onPress={onOpenDetails}
          style={({ pressed }) => [styles.detailsButton, pressed && styles.pressed]}
        >
          <Text style={styles.detailsLabel}>Lihat detail sesi</Text>
        </Pressable>
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
  cardHighlight: { borderWidth: 1.5, borderColor: colors.borderHighlight },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  titleGroup: { flex: 1, gap: 2 },
  meeting: { fontSize: typography.caption, fontWeight: fontWeights.semibold, letterSpacing: 0.4, textTransform: 'uppercase', color: colors.primary },
  title: { fontSize: typography.bodyLarge, fontWeight: fontWeights.semibold, color: colors.text },
  meta: { fontSize: typography.secondary, color: colors.textMuted },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  date: { flex: 1, fontSize: typography.secondary, color: colors.textMuted },
  time: { fontSize: typography.secondary, fontWeight: fontWeights.semibold, color: colors.textBody },
  actions: { gap: spacing.xs, marginTop: spacing.xs },
  attendanceButton: { minHeight: 42, borderRadius: radius.md, paddingHorizontal: spacing.md, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  attendanceLabel: { fontSize: typography.secondary, fontWeight: fontWeights.semibold, color: colors.white },
  attendanceArrow: { fontSize: typography.bodyLarge, fontWeight: fontWeights.semibold, color: colors.white },
  detailsButton: { alignSelf: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  detailsLabel: { fontSize: typography.secondary, fontWeight: fontWeights.semibold, color: colors.link },
  pressed: { opacity: 0.76 },
});
