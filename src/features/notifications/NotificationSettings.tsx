import { useSyncExternalStore } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '../../components/Text';
import { ActionButton } from '../../components/ActionButton';
import { colors } from '../../theme/tokens';
import { useAuth } from '../auth/AuthProvider';
import { registerDevicePush } from './device';
import { pushStatus, pushMessages } from './status';

export function NotificationSettings() {
  const { account } = useAuth();
  const router = useRouter();
  const status = useSyncExternalStore(
    pushStatus.subscribe,
    pushStatus.getSnapshot,
    pushStatus.getSnapshot,
  );
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Notifikasi kegiatan</Text>
      <Text accessibilityLiveRegion="polite" style={styles.copy}>
        {pushMessages[status]}
      </Text>
      {status === 'denied' && (
        <ActionButton
          title="Buka pengaturan notifikasi"
          secondary
          onPress={() => {
            void Linking.openSettings().catch(() => pushStatus.set('error'));
          }}
        />
      )}
      {status !== 'unsupported' && (
        <ActionButton
          title="Periksa ulang notifikasi"
          secondary
          disabled={status === 'loading'}
          onPress={() => {
            if (account) void registerDevicePush(account.uid, pushStatus.set);
          }}
        />
      )}
      <ActionButton title="Lihat pemberitahuan" onPress={() => router.push('/notifikasi')} />
    </View>
  );
}
const styles = StyleSheet.create({
  card: { backgroundColor: colors.lime, borderRadius: 28, padding: 24, gap: 16 },
  title: { color: colors.navy, fontSize: 20, fontWeight: '800' },
  copy: { color: colors.navy, fontSize: 14, lineHeight: 22 },
});
