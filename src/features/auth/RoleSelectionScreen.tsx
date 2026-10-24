import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ActionButton } from '../../components/ActionButton';
import { SelectionLayout } from '../../components/SelectionLayout';
import { Text } from '../../components/Text';
import { colors } from '../../theme/tokens';
import type { Role } from '../../core/roles';
import { useRole } from '../../core/role-context';
import { RoleIcon } from './RoleIcon';

const roles = [
  {
    id: 'praktikan',
    title: 'Praktikan',
    description: 'Ikuti praktikum dan catat kehadiranmu.',
  },
  {
    id: 'asisten',
    title: 'Asisten',
    description: 'Kelola sesi dan pantau kehadiran praktikan.',
  },
] as const;

export function RoleSelectionScreen({ switching = false }: { switching?: boolean }) {
  const { currentUser } = useRole();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  function confirmRole() {
    if (!selectedRole) return;
    router.navigate({
      pathname: '/pilih-identitas',
      params: { role: selectedRole, ...(switching ? { mode: 'switch' } : {}) },
    });
  }

  return (
    <SelectionLayout
      title="Masuk sebagai siapa?"
      subtitle="Pilih peranmu untuk memulai aktivitas praktikum."
    >
      {switching && currentUser && (
        <Text style={styles.activeUser}>
          Pengguna aktif: {currentUser.name}. Peran berubah setelah identitas baru dikonfirmasi.
        </Text>
      )}
      <View
        style={styles.choices}
        accessibilityRole="radiogroup"
        accessibilityLabel="Pilihan peran"
      >
        {roles.map((role) => {
          const selected = selectedRole === role.id;
          return (
            <Pressable
              key={role.id}
              testID={`role-${role.id}`}
              accessibilityRole="radio"
              accessibilityLabel={`${role.title}. ${role.description}`}
              accessibilityState={{ checked: selected }}
              onPress={() => setSelectedRole(role.id)}
              style={({ pressed }) => [
                styles.card,
                selected && styles.cardSelected,
                pressed && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.roleIcon,
                  role.id === 'asisten' && styles.assistantIcon,
                  selected && styles.roleIconSelected,
                ]}
              >
                <RoleIcon kind={role.id} color={colors.navy} />
              </View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardTitle}>{role.title}</Text>
                <Text style={styles.cardDescription}>{role.description}</Text>
              </View>
              <View style={[styles.indicator, selected && styles.indicatorSelected]}>
                {selected && <Text style={styles.check}>✓</Text>}
              </View>
            </Pressable>
          );
        })}
      </View>
      <ActionButton
        title="Lanjutkan →"
        disabled={!selectedRole}
        onPress={confirmRole}
        testID="continue-button"
      />
      {switching && (
        <ActionButton
          title="Batal, kembali ke profil"
          secondary
          onPress={() => router.dismissTo('/profil')}
        />
      )}
    </SelectionLayout>
  );
}

const styles = StyleSheet.create({
  activeUser: {
    color: colors.navy,
    fontSize: 12,
    lineHeight: 20,
    backgroundColor: colors.lavender,
    padding: 14,
    borderRadius: 18,
  },
  choices: { gap: 12, marginBottom: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    minHeight: 110,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 24,
    backgroundColor: colors.white,
  },
  cardSelected: { borderColor: colors.blue, backgroundColor: colors.lime },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: colors.paleBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assistantIcon: { backgroundColor: colors.lavender },
  roleIconSelected: { backgroundColor: colors.white },
  cardCopy: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 16, color: colors.navy, fontWeight: '800' },
  cardDescription: { fontSize: 13, lineHeight: 20, color: colors.muted, marginTop: 5 },
  indicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorSelected: { backgroundColor: colors.navy, borderColor: colors.navy },
  check: { color: colors.white, fontSize: 13, fontWeight: '800' },
  pressed: { opacity: 0.75 },
});
