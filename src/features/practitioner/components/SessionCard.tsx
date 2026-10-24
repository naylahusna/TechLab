import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SESSION_STATUS_META } from '../lib/status';
import { colors, radius, spacing, typography } from '../theme';
import type { SessionListItem } from '../types';
import { Badge } from './Badge';

type SessionCardProps = {
  session: SessionListItem;
  onPress: () => void;
};

export function SessionCard({ session, onPress }: SessionCardProps) {
  const status = SESSION_STATUS_META[session.status];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Buka detail ${session.practicalName}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {session.practicalName}
        </Text>
        <Badge label={status.label} tone={status.tone} />
      </View>

      <Text style={styles.meta}>
        {session.className} - {session.lab}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.date}>{session.dateLabel}</Text>
        <Text style={styles.time}>{session.timeLabel}</Text>
      </View>

      <Text style={styles.hint}>Lihat detail sesi</Text>
    </Pressable>
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
  pressed: {
    opacity: 0.88,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: colors.text,
  },
  meta: {
    fontSize: typography.body,
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
  hint: {
    marginTop: spacing.xs,
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
});
