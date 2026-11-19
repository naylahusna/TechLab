import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '../../../components/Text';
import { colors, fontWeights, radius, spacing, typography } from '../theme';

type OptionPickerFieldProps = {
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function OptionPickerField({
  label,
  value,
  options,
  placeholder,
  onChange,
  disabled = false,
}: OptionPickerFieldProps) {
  const [visible, setVisible] = useState(false);
  const visibleOptions = value && !options.includes(value) ? [value, ...options] : options;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}${value ? `, ${value}` : ''}`}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => setVisible(true)}
        style={({ pressed }) => [
          styles.input,
          disabled && styles.disabled,
          pressed && !disabled && styles.pressed,
        ]}
      >
        <Text style={value ? styles.value : styles.placeholder}>
          {value || placeholder}
        </Text>
        <Text style={styles.chevron}>⌄</Text>
      </Pressable>

      <Modal
        transparent
        animationType="fade"
        visible={visible}
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalEyebrow}>PILIH {label.toUpperCase()}</Text>
            <Text style={styles.modalTitle}>{value || placeholder}</Text>
            <ScrollView
              contentContainerStyle={styles.options}
              showsVerticalScrollIndicator={false}
              style={styles.optionsScroll}
            >
              {visibleOptions.map((option) => {
                const selected = option === value;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    accessibilityLabel={`Pilih ${option}`}
                    onPress={() => {
                      onChange(option);
                      setVisible(false);
                    }}
                    style={[styles.option, selected && styles.selectedOption]}
                  >
                    <Text style={[styles.optionText, selected && styles.selectedOptionText]}>
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
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
  chevron: { color: colors.primary, fontSize: 22, lineHeight: 22 },
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
    maxHeight: '78%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  modalEyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: fontWeights.bold,
    letterSpacing: 1.2,
  },
  modalTitle: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: fontWeights.bold,
  },
  optionsScroll: { maxHeight: 360 },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  option: {
    width: '48%',
    minHeight: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  selectedOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: fontWeights.semibold,
    textAlign: 'center',
  },
  selectedOptionText: { color: colors.white },
  closeButton: {
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: fontWeights.bold,
  },
});
