import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '../../../components/Text';
import { getAttendanceStatusTone } from '../lib/assistant-mapping';
import { colors, fontWeights, radius, spacing, typography } from '../theme';
import type { ParticipantItem } from '../types';
import { AssistantBadge } from './AssistantBadge';
import type { AttendanceOverrideStatus } from '../../practicum/types';

const STATUS_ACTIONS: readonly { status: AttendanceOverrideStatus; label: string }[] = [
  { status: 'present', label: 'Hadir' },
  { status: 'excused', label: 'Izin' },
  { status: 'absent', label: 'Tidak Hadir' },
];

type ParticipantCardProps = {
  participant: ParticipantItem;
  onSetStatus: (status: AttendanceOverrideStatus) => void;
  disabled?: boolean;
};

export function ParticipantCard({ participant, onSetStatus, disabled = false }: ParticipantCardProps) {
  const tone = participant.overrideStatus
    ? getAttendanceStatusTone(participant.status)
    : participant.status === 'present'
      ? 'success'
      : participant.permissionStatus === 'approved'
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
      <View style={styles.statusEditor}>
        <Text style={styles.editorLabel}>Atur status kehadiran</Text>
        <View style={styles.actions}>
        {STATUS_ACTIONS.map(({ status, label }) => (
          <Pressable
            key={status}
            accessibilityRole="button"
            accessibilityState={{ selected: participant.overrideStatus === status, disabled }}
            disabled={disabled}
            onPress={() => onSetStatus(status)}
            style={({ pressed }) => [
              styles.action,
              participant.overrideStatus === status && (status === 'present' ? styles.presentSelected : status === 'excused' ? styles.excusedSelected : styles.absentSelected),
              pressed && styles.actionPressed,
              disabled && styles.actionDisabled,
            ]}
          >
            <Text style={[styles.actionText, participant.overrideStatus === status && styles.actionTextSelected]}>{label}</Text>
          </Pressable>
        ))}
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={disabled || participant.overrideStatus === 'absent'}
          accessibilityState={{ selected: participant.overrideStatus === 'absent', disabled: disabled || participant.overrideStatus === 'absent' }}
          onPress={() => onSetStatus('absent')}
          style={({ pressed }) => [styles.resetAction, pressed && styles.actionPressed, (disabled || participant.overrideStatus === 'absent') && styles.actionDisabled]}
        >
          <Text style={styles.resetText}>Reset status ke Tidak Hadir</Text>
        </Pressable>
        {disabled ? <Text style={styles.savingText}>Menyimpan status...</Text> : null}
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
  statusEditor: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm },
  editorLabel: { color: colors.textMuted, fontSize: typography.caption, fontWeight: fontWeights.semibold },
  actions: { flexDirection: 'row', gap: spacing.xs },
  action: { flex: 1, minHeight: 38, paddingHorizontal: spacing.xs, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border },
  actionPressed: { opacity: 0.7 },
  actionDisabled: { opacity: 0.5 },
  actionText: { color: colors.text, fontSize: typography.caption, fontWeight: fontWeights.semibold, textAlign: 'center' },
  presentSelected: { backgroundColor: colors.success, borderColor: colors.success },
  excusedSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  absentSelected: { backgroundColor: colors.danger, borderColor: colors.danger },
  actionTextSelected: { color: colors.white },
  resetAction: { minHeight: 36, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  resetText: { color: colors.textMuted, fontSize: typography.caption, fontWeight: fontWeights.medium },
  savingText: { color: colors.textMuted, fontSize: typography.caption, textAlign: 'center' },
});
