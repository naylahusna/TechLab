import { FlatList, StyleSheet, View } from 'react-native';

import { ScreenHeader, type ScreenSummaryItem } from '../../practitioner/components/ScreenHeader';
import { AssistantEmptyState } from '../components/AssistantEmptyState';
import { AssistantSessionCard } from '../components/AssistantSessionCard';
import { colors, spacing } from '../theme';
import type { AssistantSessionItem } from '../types';

type AssistantJadwalScreenProps = {
  sessions: AssistantSessionItem[];
  assistantName?: string;
  assistantInitials?: string;
  onOpenSession: (sessionId: string) => void;
};

export function AssistantJadwalScreen({
  sessions,
  assistantName,
  assistantInitials,
  onOpenSession,
}: AssistantJadwalScreenProps) {
  const isEmpty = sessions.length === 0;
  const openCount = sessions.filter((session) => session.status === 'open').length;

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
        title="Sesi Praktikum"
        subtitle="Pilih sesi untuk membuka presensi, menutup sesi, atau melihat rekap."
        roleLabel="Asisten"
        greeting={assistantName}
        initials={assistantInitials}
        summary={summary}
      />

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={isEmpty ? styles.emptyContent : styles.listContent}
        ListEmptyComponent={<AssistantEmptyState kind="jadwal" />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <AssistantSessionCard
            session={item}
            onPress={() => onOpenSession(item.id)}
          />
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
