import { Redirect, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../../components/ActionButton';
import { AppPage } from '../../components/AppPage';
import { TabIcon } from '../../components/TabIcon';
import { navigationFor } from '../../core/navigation';
import { useRole } from '../../core/role-context';
import { colors } from '../../theme/tokens';

/** Navigation destinations only. Feature owners replace the empty content later. */
export function NavigationLandingScreen({ page }: { page: 'jadwal' | 'catatan' }) {
  const { currentUser } = useRole();
  if (!currentUser) return <Redirect href="/" />;
  const navigation = navigationFor(currentUser.role);
  const content = navigation[page];
  const student = currentUser.role === 'praktikan';
  return (
    <AppPage title={content.title} subtitle={content.subtitle}>
      <View style={styles.activeIdentity}>
        <View style={styles.statusDot} />
        <View style={styles.identityCopy}>
          <Text style={styles.identityName}>{currentUser.name}</Text>
          <Text style={styles.identityGroup}>{currentUser.group}</Text>
        </View>
        <Text style={styles.identityLabel}>{student ? 'NIM' : 'ID'} {currentUser.number}</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.icon}><TabIcon kind={page} color={colors.blue} /></View>
        <Text accessibilityRole="header" style={styles.emptyTitle}>{content.emptyTitle}</Text>
        <Text style={styles.emptyDescription}>{content.emptyDescription}</Text>
      </View>
      <View style={styles.links}>
        <Text style={styles.sectionLabel}>JELAJAHI TECHLAB</Text>
        <ActionButton title={page === 'jadwal' ? `Buka ${navigation.catatan.label.toLowerCase()} kehadiran` : `Kembali ke ${navigation.jadwal.label.toLowerCase()}`} onPress={() => router.navigate(page === 'jadwal' ? '/catatan' : '/jadwal')} />
        <ActionButton title="Profil & ganti pengguna" secondary onPress={() => router.navigate('/profil')} />
      </View>
    </AppPage>
  );
}

const styles = StyleSheet.create({
  activeIdentity: { backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: 16, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  statusDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#35AA90' },
  identityCopy: { flexGrow: 1, flexShrink: 1 },
  identityName: { fontSize: 13, fontWeight: '700', color: colors.navy },
  identityGroup: { fontSize: 11, color: colors.muted, marginTop: 4 },
  identityLabel: { fontSize: 10, color: colors.muted },
  card: { backgroundColor: colors.white, borderRadius: 24, borderWidth: 1, borderColor: colors.line, padding: 28, alignItems: 'center', gap: 14 },
  icon: { width: 64, height: 64, borderRadius: 22, backgroundColor: colors.paleBlue, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: colors.navy, fontSize: 18, fontWeight: '700', lineHeight: 26, textAlign: 'center', marginTop: 4 },
  emptyDescription: { color: colors.muted, fontSize: 13, lineHeight: 22, textAlign: 'center', maxWidth: 380 },
  links: { backgroundColor: colors.white, padding: 20, borderRadius: 22, borderWidth: 1, borderColor: colors.line, gap: 12 },
  sectionLabel: { color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.4, marginBottom: 4 },
});
