import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ActionButton } from '../../components/ActionButton';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { SelectionLayout } from '../../components/SelectionLayout';
import { Text } from '../../components/Text';
import { useRole } from '../../core/role-context';
import type { Role } from '../../core/roles';
import { findUser, usersForRole } from '../../core/users';
import { colors } from '../../theme/tokens';

export function IdentitySelectionScreen({
  role,
  switching = false,
}: {
  role: Role;
  switching?: boolean;
}) {
  const { selectUser, currentUser } = useRole();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const label = role === 'praktikan' ? 'Praktikan' : 'Asisten';
  const selectedUser = findUser(selectedId);
  const unchanged = switching && selectedId === currentUser?.id;

  function confirmIdentity() {
    if (!selectedId) return;
    if (!selectUser(selectedId, role)) {
      setError('Identitas tidak sesuai dengan peran yang dipilih. Silakan pilih lagi.');
      return;
    }
    setShowConfirmation(false);
    router.replace('/beranda');
  }

  function continueSelection() {
    if (switching) {
      setShowConfirmation(true);
    } else {
      confirmIdentity();
    }
  }

  function goBack() {
    if (switching) {
      router.dismissTo('/profil');
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  return (
    <SelectionLayout
      title="Pilih identitasmu"
      subtitle={`Gunakan salah satu identitas contoh untuk mencoba aktivitas ${label.toLowerCase()}.`}
      eyebrow="LANGKAH 02 · IDENTITAS"
      storyTitle={'Kenali peranmu.\nMulai ceritamu.'}
    >
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{label}</Text>
      </View>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={`Identitas ${label}`}
        style={styles.list}
      >
        {usersForRole(role).map((user) => {
          const selected = selectedId === user.id;
          return (
            <Pressable
              key={user.id}
              testID={`identity-${user.id}`}
              accessibilityRole="radio"
              accessibilityLabel={`${user.name}, ${user.number}, ${user.group}`}
              accessibilityState={{ checked: selected }}
              onPress={() => {
                setSelectedId(user.id);
                setError('');
              }}
              style={({ pressed }) => [
                styles.card,
                selected && styles.selected,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.avatar}>
                <Text style={styles.initials}>{user.initials}</Text>
              </View>
              <View style={styles.copy}>
                <Text style={styles.name}>
                  {user.name}
                  {user.id === currentUser?.id ? ' · Aktif' : ''}
                </Text>
                <Text style={styles.number}>
                  {role === 'praktikan' ? 'NIM' : 'ID'} {user.number}
                </Text>
                <Text style={styles.group}>{user.group}</Text>
              </View>
              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected && <Text style={styles.check}>✓</Text>}
              </View>
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      <ActionButton
        title={unchanged ? 'Identitas sedang digunakan' : 'Gunakan identitas'}
        disabled={!selectedId || unchanged}
        onPress={continueSelection}
        testID="confirm-identity"
      />
      <ActionButton
        title={switching ? 'Batal, kembali ke profil' : 'Kembali ke pilihan peran'}
        secondary
        onPress={goBack}
      />
      <ConfirmationModal
        visible={showConfirmation}
        title="Ganti pengguna aktif?"
        description={`Dari ${currentUser?.name ?? ''} ke ${selectedUser?.name ?? ''} sebagai ${label}. Pilihan ini akan memperbarui tampilan pengguna aktif.`}
        confirmLabel="Ya, ganti pengguna"
        onConfirm={confirmIdentity}
        onCancel={() => setShowConfirmation(false)}
      />
    </SelectionLayout>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    backgroundColor: colors.lavender,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  badgeText: { color: colors.navy, fontWeight: '800', fontSize: 12 },
  list: { gap: 12, marginBottom: 8 },
  card: {
    padding: 16,
    minHeight: 110,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selected: { backgroundColor: colors.lime, borderColor: colors.blue },
  pressed: { opacity: 0.75 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 17,
    backgroundColor: colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { color: colors.navy, fontWeight: '800', fontSize: 15 },
  copy: { flex: 1 },
  name: { fontWeight: '700', color: colors.navy, fontSize: 14 },
  number: { color: colors.muted, fontSize: 12, marginTop: 5 },
  group: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 3 },
  radio: {
    width: 24,
    height: 24,
    borderWidth: 1.5,
    borderColor: colors.muted,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { backgroundColor: colors.navy, borderColor: colors.navy },
  check: { color: colors.white, fontWeight: '800', fontSize: 13 },
  error: { color: colors.danger, lineHeight: 20 },
});
