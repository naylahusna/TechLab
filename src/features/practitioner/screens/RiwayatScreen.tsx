import { FlatList, StyleSheet, View } from 'react-native';
import { EmptyState } from '../components/EmptyState';
import { HistoryCard } from '../components/HistoryCard';
import { ScreenHeader } from '../components/ScreenHeader';
import { colors, spacing } from '../theme';
import type { RiwayatItem } from '../types';

type RiwayatScreenProps = {
  items: RiwayatItem[];
};

/** Riwayat kehadiran pribadi (SRS-20) dengan kondisi kosong (SRS-23). */
export function RiwayatScreen({ items }: RiwayatScreenProps) {
  const isEmpty = items.length === 0;

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Riwayat Kehadiran"
        subtitle="Catatan kehadiranmu pada sesi yang pernah diikuti."
      />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={isEmpty ? styles.emptyContent : styles.listContent}
        ListEmptyComponent={
          <EmptyState
            title="Belum ada riwayat"
            message="Catatan kehadiran akan muncul setelah kamu mengikuti sesi praktikum."
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => <HistoryCard item={item} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  separator: {
    height: spacing.lg,
  },
});
