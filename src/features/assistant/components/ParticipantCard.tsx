import { StyleSheet, View } from 'react-native';

import { Text } from '../../../components/Text';
import { getAttendanceStatusTone } from '../lib/assistant-mapping';
import { colors, fontWeights, radius, spacing, typography } from '../theme';
import type { ParticipantItem } from '../types';
import { AssistantBadge } from './AssistantBadge';

type ParticipantCardProps = {
  participant: ParticipantItem;
};

export function ParticipantCard({ participant }: ParticipantCardProps) {
  const tone = getAttendanceStatusTone(participant.status);

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
});
