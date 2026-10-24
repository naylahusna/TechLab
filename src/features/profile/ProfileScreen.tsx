import { Redirect, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';

import { ActionButton } from '../../components/ActionButton';
import { AppPage } from '../../components/AppPage';
import { useRole } from '../../core/role-context';
import { colors } from '../../theme/tokens';

export function ProfileScreen() {
  const { currentUser } = useRole();
  if (!currentUser) return <Redirect href="/" />;
  const student = currentUser.role === 'praktikan';
  return (
    <AppPage
      title="Profil pengguna"
      subtitle="Lihat identitas aktif atau coba sudut pandang pengguna lain."
    >
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{currentUser.initials}</Text>
        </View>
        <Text style={styles.name}>{currentUser.name}</Text>
        <View style={styles.badge}>
          <Text style={styles.role}>{student ? 'Praktikan' : 'Asisten'}</Text>
        </View>
        <View style={styles.line} />
        <View style={styles.row}>
          <Text style={styles.label}>{student ? 'NIM' : 'ID Asisten'}</Text>
          <Text style={styles.value}>{currentUser.number}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{student ? 'Kelas' : 'Penugasan'}</Text>
          <Text style={styles.value}>{currentUser.group}</Text>
        </View>
      </View>
      <ActionButton
        title="Ganti identitas"
        onPress={() =>
          router.navigate({
            pathname: '/pilih-identitas',
            params: { role: currentUser.role, mode: 'switch' },
          })
        }
        testID="switch-identity"
      />
      <ActionButton
        title="Ganti peran"
        secondary
        onPress={() => router.navigate({ pathname: '/', params: { mode: 'switch' } })}
        testID="switch-role"
      />
      <Text style={styles.note}>
        Pilihan baru digunakan setelah kamu mengonfirmasi. Membatalkan pilihan akan mempertahankan
        pengguna aktif.
      </Text>
      <ActionButton
        title="Kembali ke jadwal"
        secondary
        onPress={() => router.navigate('/jadwal')}
      />
    </AppPage>
  );
}

const styles = StyleSheet.create({
  profile: {
    padding: 24,
    borderRadius: 28,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  avatar: {
    width: 76,
    height: 76,
    backgroundColor: colors.lavender,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: { color: colors.navy, fontSize: 26, fontWeight: '800' },
  name: { color: colors.navy, fontSize: 21, fontWeight: '700', textAlign: 'center' },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.lime,
  },
  role: { color: colors.navy, fontSize: 12, fontWeight: '800' },
  line: { height: 1, width: '100%', backgroundColor: colors.line, marginVertical: 4 },
  row: { flexDirection: 'row', width: '100%', gap: 16 },
  label: { color: colors.muted, fontSize: 12, minWidth: 64, lineHeight: 20 },
  value: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    lineHeight: 20,
  },
  note: { color: colors.muted, fontSize: 12, lineHeight: 20 },
});
