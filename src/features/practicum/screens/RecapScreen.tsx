import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '../../../components/Text';
import { Badge } from '../../practitioner/components/Badge';
import { PracticumHeader } from '../components/PracticumHeader';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { SyncStatusBanner } from '../components/SyncStatusBanner';
import { useRecap, useSessionDetail } from '../hooks';
import {
  RECAP_STATUS_LABEL,
  RECAP_STATUS_TONE,
  recapTimeLabel,
  timestampDateLabel,
} from '../session-view';
import { colors, fontWeights, lineHeights, radius, spacing, typography } from '../theme';
import type { PracticumRecapStatus } from '../types';

type Filter = 'all' | PracticumRecapStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'present', label: 'Hadir' },
  { value: 'excused', label: 'Izin' },
  { value: 'pending', label: 'Izin Menunggu' },
  { value: 'absent', label: 'Tidak Hadir' },
  { value: 'belum-presensi', label: 'Belum Presensi' },
];

export function RecapScreen({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const detail = useSessionDetail(sessionId);
  const recap = useRecap(sessionId);
  const [filter, setFilter] = useState<Filter>('all');

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/jadwal');
  }

  const loading =
    (detail.status === 'loading' || recap.status === 'loading') && recap.items.length === 0;
  const error = detail.error ?? recap.error;
  const entries = recap.items;
  const counts = entries.reduce(
    (acc, entry) => {
      acc[entry.status] += 1;
      return acc;
    },
    {
      present: 0,
      excused: 0,
      pending: 0,
      absent: 0,
      'belum-presensi': 0,
    } as Record<PracticumRecapStatus, number>,
  );
  const filtered = filter === 'all' ? entries : entries.filter((entry) => entry.status === filter);

  return (
    <View style={styles.screen}>
      <PracticumHeader
        eyebrow="Asisten"
        title="Rekap Kehadiran"
        subtitle={
          detail.session
            ? `${detail.classItem?.className ?? ''} · ${timestampDateLabel(detail.session.startAt)}`
            : 'Rekap sesi praktikum.'
        }
        onBack={goBack}
      />

      <SyncStatusBanner
        error={detail.syncError ?? recap.syncError}
        fromCache={detail.fromCache || recap.fromCache}
        onRetry={() => {
          detail.retrySync();
          recap.retrySync();
        }}
      />

      {loading ? <LoadingState message="Memuat rekap…" /> : null}

      {!loading && error ? (
        <ErrorState
          message={error}
          onRetry={() => {
            void detail.reload();
            void recap.reload();
          }}
        />
      ) : null}

      {!loading && !error ? (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryGrid}>
            <Summary label="Total" value={entries.length} />
            <Summary label="Hadir" value={counts.present} tone="success" />
            <Summary label="Izin" value={counts.excused} tone="info" />
            <Summary label="Tidak Hadir" value={counts.absent} tone="danger" />
            <Summary label="Izin Menunggu" value={counts.pending} tone="warning" />
            <Summary label="Belum Presensi" value={counts['belum-presensi']} />
          </View>

          <View style={styles.filterRow}>
            {FILTERS.map((item) => {
              const active = filter === item.value;
              return (
                <Pressable
                  key={item.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setFilter(item.value)}
                  style={({ pressed }) => [
                    styles.chip,
                    active && styles.chipActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {filtered.length === 0 ? (
            <EmptyState
              title="Tidak ada data"
              message="Tidak ada peserta yang cocok dengan filter ini."
            />
          ) : (
            <View style={styles.list}>
              {filtered.map((entry) => {
                const time = recapTimeLabel(entry);
                return (
                  <View key={entry.participant.id} style={styles.row}>
                    <View style={styles.rowInfo}>
                      <Text style={styles.name}>{entry.participant.studentName}</Text>
                      <Text style={styles.meta}>
                        {entry.participant.studentNumber}
                        {time ? ` · ${time}` : ''}
                      </Text>
                      {entry.permission ? (
                        <Text style={styles.reason} numberOfLines={2}>
                          {entry.permission.reason}
                          {entry.permission.aiCategory
                            ? ` · AI: ${entry.permission.aiCategory}`
                            : ''}
                        </Text>
                      ) : null}
                    </View>
                    <Badge
                      label={RECAP_STATUS_LABEL[entry.status]}
                      tone={RECAP_STATUS_TONE[entry.status]}
                    />
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      ) : null}
    </View>
  );
}

function Summary({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'success' | 'info' | 'danger' | 'warning';
}) {
  const palette =
    tone === 'success'
      ? { backgroundColor: colors.successSoft, color: colors.success }
      : tone === 'danger'
        ? { backgroundColor: colors.dangerSoft, color: colors.danger }
        : tone === 'warning'
          ? { backgroundColor: colors.warningSoft, color: colors.warning }
          : tone === 'info'
            ? { backgroundColor: colors.primarySoft, color: colors.primary }
            : { backgroundColor: colors.surface, color: colors.text };
  return (
    <View style={[styles.summaryCard, { backgroundColor: palette.backgroundColor }]}>
      <Text style={[styles.summaryValue, { color: palette.color }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color: palette.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  summaryCard: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 96,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 2,
  },
  summaryValue: {
    fontSize: typography.title,
    fontWeight: fontWeights.bold,
  },
  summaryLabel: {
    fontSize: typography.caption,
    fontWeight: fontWeights.semibold,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipLabel: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: fontWeights.semibold,
  },
  chipLabelActive: { color: colors.white },
  pressed: { opacity: 0.8 },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowInfo: { flex: 1, gap: 2 },
  name: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: fontWeights.semibold,
  },
  meta: {
    color: colors.textMuted,
    fontSize: typography.caption,
  },
  reason: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: lineHeights.body,
    marginTop: 2,
  },
});
