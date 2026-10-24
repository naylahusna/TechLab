import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '../../../components/Text';
import { getSessionStatusTone } from '../lib/assistant-mapping';
import { colors, fontWeights, radius, spacing, typography } from '../theme';
import type { AssistantSessionItem } from '../types';
import { AssistantBadge } from './AssistantBadge';

type AssistantSessionCardProps = {
  session: AssistantSessionItem;
  onPress: () => void;
};

export function AssistantSessionCard({
  session,
  onPress,
}: AssistantSessionCardProps) {
  const tone = getSessionStatusTone(session.status);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Sesi ${session.practicalName}, ${session.meetingLabel}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.meeting}>{session.meetingLabel}</Text>
        <AssistantBadge label={session.statusLabel} tone={tone} />
      </View>

      <Text style={styles.title}>{session.practicalName}</Text>

      <View style={styles.metaContainer}>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Kelas & Lab:</Text>
          <Text style={styles.metaValue}>
            {session.className} · {session.lab}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Waktu:</Text>
          <Text style={styles.metaValue}>
            {session.dateLabel}, {session.timeRangeLabel}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Peserta:</Text>
          <Text style={styles.metaValue}>
            {session.studentCount} praktikan terdaftar
          </Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.actionPrompt}>Kelola sesi praktikum →</Text>
      </View>
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
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.995 }],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  meeting: {
    fontSize: typography.secondary,
    fontWeight: fontWeights.bold,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: typography.title,
    fontWeight: fontWeights.bold,
    color: colors.text,
    lineHeight: 26,
  },
  metaContainer: {
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaLabel: {
    fontSize: typography.secondary,
    color: colors.textMuted,
    minWidth: 80,
  },
  metaValue: {
    fontSize: typography.secondary,
    fontWeight: fontWeights.medium,
    color: colors.text,
    flex: 1,
  },
  footerRow: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionPrompt: {
    fontSize: typography.secondary,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
});
