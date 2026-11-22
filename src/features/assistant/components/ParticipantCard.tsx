import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '../../../components/Text';
import { getAttendanceStatusTone } from '../lib/assistant-mapping';
import { colors, fontWeights, radius, spacing, typography } from '../theme';
import type { ParticipantItem } from '../types';
import { AssistantBadge } from './AssistantBadge';
import type { AttendanceOverrideStatus } from '../../practicum/types';

type ParticipantCardProps = {
  participant: ParticipantItem;
  onSetStatus: (status: AttendanceOverrideStatus) => void;
  disabled?: boolean;
};

export function ParticipantCard({ participant, onSetStatus, disabled = false }: ParticipantCardProps) {
  const tone = participant.status === 'present'
    ? 'success'
    : participant.status === 'excused' || participant.permissionStatus === 'approved'
      ? 'info'
      : participant.permissionStatus === 'pending'
        ? 'warning'
        : getAttendanceStatusTone(participant.status);

  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <View style={styles.info}>
          <Text style={styles.name}>{participant.name}</Text>
          <Text style={styles.nim}>NIM {participant.nim}</Text>
          {participant.attendedAtLabel ? (
            <Text style={styles.attendedAt}>
              Tercatat hadir pukul {participant.attendedAtLabel}
            </Text>
          ) : null}
        </View>

        <View style={styles.badgeContainer}>
          <AssistantBadge label={participant.statusLabel} tone={tone} />
        </View>
      </View>
      <View style={styles.actions}>
        {([
          ['present', 'Hadir'],
          ['excused', 'Izin'],
          ['absent', 'Tidak hadir'],
          ['pending', 'Reset'],
        ] as const).map(([status, label]) => (
          <Pressable
            key={status}
            accessibilityRole="button"
            disabled={disabled || (participant.hasRecordedAttendance === true && status !== 'present')}
            onPress={() => onSetStatus(status)}
            style={({ pressed }) => [styles.action, pressed && styles.actionPressed, disabled && styles.actionDisabled]}
          >
            <Text style={styles.actionText}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: typography.body,
    fontWeight: fontWeights.semibold,
    color: colors.text,
  },
  nim: {
    fontSize: typography.secondary,
    color: colors.textMuted,
  },
  attendedAt: {
    marginTop: 2,
    fontSize: typography.caption,
    fontWeight: fontWeights.medium,
    color: colors.success,
  },
  badgeContainer: {
    alignSelf: 'flex-start',
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.md },
  action: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted },
  actionPressed: { opacity: 0.7 },
  actionDisabled: { opacity: 0.4 },
  actionText: { color: colors.primary, fontSize: typography.caption, fontWeight: fontWeights.semibold },
});
