import { FlatList, StyleSheet, View } from 'react-native';
import { EmptyState } from '../components/EmptyState';
import { ScreenHeader } from '../components/ScreenHeader';
import { SessionCard } from '../components/SessionCard';
import { colors, spacing } from '../theme';
import type { SessionListItem } from '../types';

type JadwalScreenProps = {
  sessions: SessionListItem[];
  onOpenSession: (sessionId: string) => void;
};

/** Jadwal praktikum milik praktikan (SRS-05) dengan kondisi kosong (SRS-23). */
export function JadwalScreen({ sessions, onOpenSession }: JadwalScreenProps) {
  const isEmpty = sessions.length === 0;

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Jadwal Praktikum"
        subtitle="Pilih sesi untuk melihat detail dan melakukan presensi."
      />

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={isEmpty ? styles.emptyContent : styles.listContent}
        ListEmptyComponent={
          <EmptyState
            title="Belum ada jadwal"
            message="Saat ini belum ada sesi praktikum yang terdaftar untukmu."
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <SessionCard session={item} onPress={() => onOpenSession(item.id)} />
        )}
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
