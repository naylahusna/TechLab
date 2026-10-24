import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '../../../components/Text';
import { SESSION_STATUS_META } from '../lib/status';
import { colors, fontWeights, radius, spacing, typography } from '../theme';
import type { SessionListItem } from '../types';
import { Badge } from './Badge';

type SessionCardProps = {
  session: SessionListItem;
  onPress: () => void;
};

export function SessionCard({ session, onPress }: SessionCardProps) {
  const status = SESSION_STATUS_META[session.status];
  const isOpen = session.status === 'dibuka';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Buka detail ${session.practicalName}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isOpen ? styles.cardHighlight : null,
        pressed ? styles.pressed : null,
      ]}
    >
      {({ pressed }) => (
        <>
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

          <Text style={[styles.hint, pressed ? styles.hintPressed : null]}>Lihat detail sesi</Text>
        </>
      )}
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
  cardHighlight: {
    borderWidth: 1.5,
    borderColor: colors.borderHighlight,
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
    fontWeight: fontWeights.semibold,
    color: colors.text,
  },
  meta: {
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
    fontSize: typography.body,
    fontWeight: fontWeights.semibold,
    color: colors.textBody,
  },
  hint: {
    marginTop: spacing.xs,
    fontSize: typography.secondary,
    fontWeight: fontWeights.semibold,
    color: colors.link,
  },
  hintPressed: {
    textDecorationLine: 'underline',
  },
});
