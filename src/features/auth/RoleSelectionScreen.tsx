import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../../components/ActionButton';
import { SelectionLayout } from '../../components/SelectionLayout';
import type { Role } from '../../core/roles';
import { RoleIcon } from './RoleIcon';

const roles = [
  {
    id: 'praktikan', title: 'Praktikan',
    description: 'Ikuti praktikum dan catat kehadiranmu.',
  },
  {
    id: 'asisten', title: 'Asisten',
    description: 'Kelola sesi dan pantau kehadiran praktikan.',
  },
] as const;

export function RoleSelectionScreen() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  function confirmRole() {
    if (!selectedRole) return;
    router.navigate({ pathname: '/pilih-identitas', params: { role: selectedRole } });
  }

  return (
    <SelectionLayout title="Masuk sebagai siapa?" subtitle="Pilih peranmu untuk memulai aktivitas praktikum.">
            <View style={styles.choices} accessibilityRole="radiogroup" accessibilityLabel="Pilihan peran">
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
                    style={({ pressed }) => [styles.card, selected && styles.cardSelected, pressed && styles.pressed]}
                  >
                    <View style={[styles.roleIcon, selected && styles.roleIconSelected]}><RoleIcon kind={role.id} /></View>
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
            <ActionButton title="Lanjutkan →" disabled={!selectedRole} onPress={confirmRole} testID="continue-button" />
    </SelectionLayout>
  );
}

const styles = StyleSheet.create({
  choices: { gap: 12, marginBottom: 12 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, minHeight: 104, borderWidth: 1.5, borderColor: '#E5EAF2', borderRadius: 18, backgroundColor: '#FFFFFF' },
  cardSelected: { borderColor: '#1459D9', backgroundColor: '#F0F5FF' },
  roleIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: '#EEF3FC', justifyContent: 'center', alignItems: 'center' },
  roleIconSelected: { backgroundColor: '#E1EBFF' },
  cardCopy: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 15, color: '#14233F', fontWeight: '700' },
  cardDescription: { fontSize: 12, lineHeight: 19, color: '#64748B', marginTop: 5 },
  indicator: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  indicatorSelected: { backgroundColor: '#1459D9', borderColor: '#1459D9' },
  check: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  pressed: { opacity: 0.75 },
});
