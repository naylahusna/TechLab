import { Modal, ScrollView, StyleSheet, View } from 'react-native';

import { colors } from '../theme/tokens';
import { ActionButton } from './ActionButton';
import { Text } from './Text';

type Props = {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmationModal({
  visible,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View accessibilityViewIsModal style={styles.dialog}>
          <ScrollView contentContainerStyle={styles.sheet}>
            <Text style={styles.label}>KONFIRMASI PENGGUNA</Text>
            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            <Text style={styles.description}>{description}</Text>
            <ActionButton title={confirmLabel} onPress={onConfirm} testID="confirm-switch" />
            <ActionButton title="Batal" secondary onPress={onCancel} testID="cancel-switch" />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#20251F80',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    backgroundColor: colors.white,
    borderRadius: 30,
    overflow: 'hidden',
  },
  sheet: { padding: 24, gap: 14 },
  label: {
    color: colors.navy,
    backgroundColor: colors.lime,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '800',
  },
  title: { color: colors.navy, fontSize: 23, fontWeight: '700', lineHeight: 31 },
  description: { color: colors.muted, fontSize: 14, lineHeight: 23, marginBottom: 8 },
});
