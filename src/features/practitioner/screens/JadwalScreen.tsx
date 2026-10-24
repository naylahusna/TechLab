import { FlatList, StyleSheet, View } from 'react-native';

import { EmptyState } from '../components/EmptyState';
import { ScreenHeader, type ScreenSummaryItem } from '../components/ScreenHeader';
import { SessionCard } from '../components/SessionCard';
import { sortSessionsForSchedule } from '../lib/session-sort';
import { colors, spacing } from '../theme';
import type { SessionListItem } from '../types';

type JadwalScreenProps = {
  sessions: SessionListItem[];
  praktikanName?: string;
  praktikanInitials?: string;
  onOpenSession: (sessionId: string) => void;
};

/** Jadwal praktikum milik praktikan (SRS-05) dengan kondisi kosong (SRS-23). */
export function JadwalScreen({
  sessions,
  praktikanName,
  praktikanInitials,
  onOpenSession,
}: JadwalScreenProps) {
  const isEmpty = sessions.length === 0;
  const sortedSessions = sortSessionsForSchedule(sessions);
  const openCount = sessions.filter((session) => session.status === 'dibuka').length;

  const summary: ScreenSummaryItem[] | undefined = isEmpty
    ? undefined
    : [
        { value: String(sessions.length), label: 'sesi' },
        {
          value: String(openCount),
          label: 'dibuka',
          tone: openCount > 0 ? 'success' : 'light',
        },
      ];

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Jadwal Praktikum"
        subtitle="Pilih sesi untuk melihat detail dan melakukan presensi."
        greeting={praktikanName}
        initials={praktikanInitials}
        summary={summary}
      />

      <FlatList
        data={sortedSessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={isEmpty ? styles.emptyContent : styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="jadwal"
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
