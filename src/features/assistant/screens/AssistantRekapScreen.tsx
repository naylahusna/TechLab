import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '../../../components/Text';
import { ScreenHeader } from '../../practitioner/components/ScreenHeader';
import { AssistantBadge } from '../components/AssistantBadge';
import { AssistantEmptyState } from '../components/AssistantEmptyState';
import { getSessionStatusTone } from '../lib/assistant-mapping';
import { colors, fontWeights, radius, spacing, typography } from '../theme';
import type { SessionWithSummary } from '../types';

type AssistantRekapScreenProps = {
  items: SessionWithSummary[];
  assistantName?: string;
  assistantInitials?: string;
  onSelectSession: (sessionId: string) => void;
};

export function AssistantRekapScreen({
  items,
  assistantName,
  assistantInitials,
  onSelectSession,
}: AssistantRekapScreenProps) {
  const isEmpty = items.length === 0;

  const totalAttendees = items.reduce((acc, curr) => acc + curr.summary.present, 0);
  const totalStudents = items.reduce((acc, curr) => acc + curr.summary.total, 0);

  const summary = isEmpty
    ? undefined
    : [
        { value: String(items.length), label: 'sesi' },
        {
          value: `${totalAttendees}/${totalStudents}`,
          label: 'hadir',
          tone: totalAttendees > 0 ? ('success' as const) : ('light' as const),
        },
      ];

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Rekap Kehadiran"
        subtitle="Pantau kehadiran praktikan pada seluruh sesi praktikum penugasanmu."
        greeting={assistantName}
        initials={assistantInitials}
        summary={summary}
      />

      <FlatList
        data={items}
        keyExtractor={(item) => item.session.id}
        contentContainerStyle={isEmpty ? styles.emptyContent : styles.listContent}
        ListEmptyComponent={<AssistantEmptyState kind="jadwal" />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => {
          const tone = getSessionStatusTone(item.session.status);

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Rekap ${item.session.practicalName}`}
              onPress={() => onSelectSession(item.session.id)}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.meeting}>{item.session.meetingLabel}</Text>
                <AssistantBadge label={item.session.statusLabel} tone={tone} />
              </View>

              <Text style={styles.title}>{item.session.practicalName}</Text>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  {item.session.className} · {item.session.lab}
                </Text>
                <Text style={styles.metaDate}>{item.session.dateLabel}</Text>
              </View>

              <View style={styles.summaryBox}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total</Text>
                  <Text style={styles.summaryValue}>{item.summary.total}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Hadir</Text>
                  <Text style={[styles.summaryValue, styles.presentValue]}>
                    {item.summary.present}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Belum Hadir</Text>
                  <Text style={[styles.summaryValue, styles.notPresentValue]}>
                    {item.summary.notPresent}
                  </Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.detailLink}>Lihat detail & daftar peserta →</Text>
              </View>
            </Pressable>
          );
        }}
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.995 }],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meeting: {
    fontSize: typography.secondary,
    fontWeight: fontWeights.bold,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: typography.bodyLarge,
    fontWeight: fontWeights.bold,
    color: colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaText: {
    fontSize: typography.secondary,
    color: colors.textMuted,
  },
  metaDate: {
    fontSize: typography.secondary,
    fontWeight: fontWeights.medium,
    color: colors.textMuted,
  },
  summaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  summaryLabel: {
    fontSize: typography.caption,
    color: colors.textMuted,
  },
  summaryValue: {
    fontSize: typography.bodyLarge,
    fontWeight: fontWeights.bold,
    color: colors.text,
  },
  presentValue: {
    color: colors.success,
  },
  notPresentValue: {
    color: colors.danger,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  cardFooter: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailLink: {
    fontSize: typography.secondary,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
});
