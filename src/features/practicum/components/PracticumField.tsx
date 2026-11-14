import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Text } from '../../../components/Text';
import { colors, fontWeights, radius, spacing, typography } from '../theme';

type PracticumFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  editable?: boolean;
  maxLength?: number;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  error?: string | null;
};

export function PracticumField({
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
  maxLength = 100,
  autoCapitalize = 'words',
  error,
}: PracticumFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        editable={editable}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        style={[styles.input, error ? styles.inputError : null]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
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
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: typography.bodyLarge,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    color: colors.danger,
    fontSize: typography.caption,
    lineHeight: 18,
  },
});
