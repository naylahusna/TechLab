import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '../../../components/Text';
import { colors, fontWeights, radius, spacing, typography } from '../theme';

type DatePickerFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

const weekdays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const monthNames = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function parseDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getFullYear() === Number(match[1]) &&
      date.getMonth() === Number(match[2]) - 1 &&
      date.getDate() === Number(match[3])
    ? date
    : null;
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function DatePickerField({
  label,
  value,
  onChange,
  disabled = false,
}: DatePickerFieldProps) {
  const selectedDate = parseDate(value);
  const [visible, setVisible] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(selectedDate ?? new Date()),
  );

  function openPicker() {
    if (disabled) return;
    setVisibleMonth(startOfMonth(selectedDate ?? new Date()));
    setVisible(true);
  }

  function changeMonth(offset: number) {
    setVisibleMonth(
      new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1),
    );
  }

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, index) =>
    index < firstDay ? null : index - firstDay + 1,
  );

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}${value ? `, ${value}` : ''}`}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={openPicker}
        style={({ pressed }) => [
          styles.input,
          disabled && styles.disabled,
          pressed && !disabled && styles.pressed,
        ]}
      >
        <Text style={value ? styles.value : styles.placeholder}>
          {value || 'Pilih tanggal'}
        </Text>
        <Text style={styles.calendarIcon}>▣</Text>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>PILIH TANGGAL</Text>
                <Text style={styles.modalTitle}>
                  {monthNames[month]} {year}
                </Text>
              </View>
              <View style={styles.monthActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Bulan sebelumnya"
                  onPress={() => changeMonth(-1)}
                  style={styles.monthButton}
                >
                  <Text style={styles.monthButtonText}>‹</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Bulan berikutnya"
                  onPress={() => changeMonth(1)}
                  style={styles.monthButton}
                >
                  <Text style={styles.monthButtonText}>›</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.weekRow}>
              {weekdays.map((day) => (
                <Text key={day} style={styles.weekday}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {cells.map((day, index) => {
                if (!day) return <View key={`empty-${index}`} style={styles.dayCell} />;
                const date = new Date(year, month, day);
                const dateValue = formatDate(date);
                const isSelected = dateValue === value;
                return (
                  <Pressable
                    key={dateValue}
                    accessibilityRole="button"
                    accessibilityLabel={`Pilih ${dateValue}`}
                    onPress={() => {
                      onChange(dateValue);
                      setVisible(false);
                    }}
                    style={[styles.dayCell, isSelected && styles.selectedDay]}
                  >
                    <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => setVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Tutup</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.sm },
  label: {
    color: colors.text,
    fontSize: typography.secondary,
    fontWeight: fontWeights.bold,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: { color: colors.text, fontSize: typography.bodyLarge },
  placeholder: { color: colors.textMuted, fontSize: typography.bodyLarge },
  calendarIcon: { color: colors.primary, fontSize: 18 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.75 },
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  modalEyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: fontWeights.bold,
    letterSpacing: 1.2,
  },
  modalTitle: {
    marginTop: spacing.xs,
    color: colors.text,
    fontSize: typography.title,
    fontWeight: fontWeights.bold,
  },
  monthActions: { flexDirection: 'row', gap: spacing.sm },
  monthButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthButtonText: { color: colors.primary, fontSize: 26, lineHeight: 28 },
  weekRow: { flexDirection: 'row' },
  weekday: {
    width: `${100 / 7}%`,
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
  },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDay: { borderRadius: radius.md, backgroundColor: colors.primary },
  dayText: { color: colors.text, fontSize: typography.body },
  selectedDayText: { color: colors.white, fontWeight: fontWeights.bold },
  closeButton: {
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: { color: colors.text, fontSize: typography.body, fontWeight: fontWeights.bold },
});
