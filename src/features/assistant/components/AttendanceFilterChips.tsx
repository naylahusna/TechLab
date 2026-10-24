import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '../../../components/Text';
import { colors, fontWeights, radius, spacing, typography } from '../theme';
import type { AttendanceFilter } from '../types';

type AttendanceFilterChipsProps = {
  selected: AttendanceFilter;
  onSelect: (filter: AttendanceFilter) => void;
  counts?: {
    all: number;
    present: number;
    notPresent: number;
  };
};

const OPTIONS: { key: AttendanceFilter; label: string }[] = [
  { key: 'semua', label: 'Semua' },
  { key: 'hadir', label: 'Hadir' },
  { key: 'belum-hadir', label: 'Belum Hadir' },
];

export function AttendanceFilterChips({
  selected,
  onSelect,
  counts,
}: AttendanceFilterChipsProps) {
  return (
    <View style={styles.container}>
      {OPTIONS.map((option) => {
        const isSelected = selected === option.key;
        let count: number | undefined;
        if (counts) {
          if (option.key === 'semua') count = counts.all;
          if (option.key === 'hadir') count = counts.present;
          if (option.key === 'belum-hadir') count = counts.notPresent;
        }

        return (
          <Pressable
            key={option.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(option.key)}
            style={({ pressed }) => [
              styles.chip,
              isSelected ? styles.chipSelected : styles.chipUnselected,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                isSelected ? styles.chipTextSelected : styles.chipTextUnselected,
              ]}
            >
              {option.label}
              {typeof count === 'number' ? ` (${count})` : ''}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipUnselected: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: typography.secondary,
    fontWeight: fontWeights.semibold,
  },
  chipTextSelected: {
    color: colors.white,
  },
  chipTextUnselected: {
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.7,
  },
});
