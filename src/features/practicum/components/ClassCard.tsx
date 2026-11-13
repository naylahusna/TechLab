import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '../../../components/Text';
import { Badge } from '../../practitioner/components/Badge';
import { colors, fontWeights, radius, spacing, typography } from '../theme';
import type { PracticumClass } from '../types';

type ClassCardProps = {
  item: PracticumClass;
  onPress: () => void;
};

export function ClassCard({ item, onPress }: ClassCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Buka kelas ${item.className}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.topRow}>
        <Text style={styles.className}>{item.className}</Text>
        <Badge
          label={item.archivedAt ? 'Diarsipkan' : 'Aktif'}
          tone={item.archivedAt ? 'neutral' : 'success'}
        />
      </View>
      <Text style={styles.course}>{item.courseName}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>{item.studentIds.length} peserta</Text>
        <Text style={styles.dot}>·</Text>
        <Text style={styles.meta}>{item.assistantIds.length} asisten</Text>
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
  pressed: { opacity: 0.8 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  className: {
    flex: 1,
    color: colors.text,
    fontSize: typography.bodyLarge,
    fontWeight: fontWeights.bold,
  },
  course: {
    color: colors.textMuted,
    fontSize: typography.body,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  meta: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: fontWeights.semibold,
  },
  dot: { color: colors.textMuted, fontSize: typography.caption },
});
