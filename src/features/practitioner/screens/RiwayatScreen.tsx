import { FlatList, StyleSheet, View } from 'react-native';

import { EmptyState } from '../components/EmptyState';
import { HistoryCard } from '../components/HistoryCard';
import { ScreenHeader, type ScreenSummaryItem } from '../components/ScreenHeader';
import { sortHistoryByDate } from '../lib/session-sort';
import { colors, spacing } from '../theme';
import type { RiwayatItem } from '../types';

type RiwayatScreenProps = {
  items: RiwayatItem[];
  praktikanName?: string;
  praktikanInitials?: string;
};

/** Riwayat kehadiran pribadi (SRS-20) dengan kondisi kosong (SRS-23). */
export function RiwayatScreen({ items, praktikanName, praktikanInitials }: RiwayatScreenProps) {
  const isEmpty = items.length === 0;
  const sortedItems = sortHistoryByDate(items);
  const presentCount = items.filter((item) => item.status === 'hadir').length;
  const absentCount = items.filter((item) => item.status === 'tidak-hadir').length;

  const summary: ScreenSummaryItem[] | undefined = isEmpty
    ? undefined
    : [
        {
          value: String(presentCount),
          label: 'hadir',
          tone: presentCount > 0 ? 'success' : 'light',
        },
        {
          value: String(absentCount),
          label: 'tidak hadir',
          tone: absentCount > 0 ? 'danger' : 'light',
        },
      ];

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Riwayat Kehadiran"
        subtitle="Catatan kehadiranmu pada sesi yang pernah diikuti."
        greeting={praktikanName}
        initials={praktikanInitials}
        summary={summary}
      />

      <FlatList
        data={sortedItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={isEmpty ? styles.emptyContent : styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="catatan"
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  separator: {
    height: spacing.lg,
  },
});
