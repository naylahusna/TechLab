import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '../../components/Text';
import { colors } from '../../theme/tokens';

type Props = { error: string | null; fromCache: boolean; retry: () => void; source: string };

export function MapSyncNotice({ error, fromCache, retry, source }: Props) {
  if (!error && !fromCache) return null;
  return (
    <View style={styles.notice} accessibilityLiveRegion="polite">
      <Text style={styles.message}>
        {error ? `Gagal menyinkronkan ${source}. ${error}` : `Menunggu koneksi untuk memperbarui ${source}.`}
      </Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Coba lagi memuat ${source}`}
        onPress={retry} style={styles.button}>
        <Text style={styles.action}>Coba lagi</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: { backgroundColor: colors.paleBlue, borderRadius: 10, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  message: { flex: 1, color: colors.navy, fontSize: 12 },
  button: { backgroundColor: colors.white, borderRadius: 8, padding: 8 },
  action: { color: colors.navy, fontSize: 12, fontWeight: '800' },
});
