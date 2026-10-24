import { Redirect, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { SelectionLayout } from '../../components/SelectionLayout';
import { ActionButton } from '../../components/ActionButton';
import { useRole } from '../../core/role-context';
import { colors } from '../../theme/tokens';
import { RoleIcon } from './RoleIcon';

export function WelcomeScreen() {
  const { currentUser } = useRole();
  if (!currentUser) return <Redirect href="/" />;
  const student = currentUser.role === 'praktikan';
  return (
    <SelectionLayout title={`Halo, ${currentUser.name.split(' ')[0]}!`} subtitle={student ? 'Siap mengikuti praktikum? Identitasmu sudah dipilih.' : 'Siap mendampingi praktikum? Identitasmu sudah dipilih.'} eyebrow="IDENTITAS AKTIF">
      <View style={styles.identity}>
        <RoleIcon kind={currentUser.role} />
        <Text style={styles.name}>{currentUser.name}</Text>
        <Text style={styles.role}>{student ? 'Praktikan' : 'Asisten'}</Text>
        <Text style={styles.detail}>{student ? 'NIM' : 'ID'} {currentUser.number}</Text>
        <Text style={styles.detail}>{currentUser.group}</Text>
      </View>
      <Text style={styles.description}>{student ? 'Jadwal, presensi, dan catatan kehadiran akan menjadi bagian aktivitasmu sebagai praktikan.' : 'Pengelolaan sesi dan pemantauan kehadiran akan menjadi bagian aktivitasmu sebagai asisten.'}</Text>
      <ActionButton title="Profil & ganti pengguna" onPress={() => router.navigate('/profil')} />
    </SelectionLayout>
  );
}

const styles = StyleSheet.create({
  identity: { backgroundColor: colors.paleBlue, borderRadius: 20, padding: 24, alignItems: 'center', gap: 10 },
  name: { color: colors.navy, fontWeight: '700', fontSize: 20, textAlign: 'center' },
  role: { color: colors.blue, fontWeight: '700', fontSize: 13 },
  detail: { color: colors.muted, fontSize: 12, textAlign: 'center' },
  description: { color: colors.muted, fontSize: 13, lineHeight: 22 },
});
