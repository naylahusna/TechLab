import { useState } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ActionButton } from '../../../components/ActionButton';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import { Text } from '../../../components/Text';
import { Badge } from '../../practitioner/components/Badge';
import { getPracticumRepository } from '../client';
import { InlineAction } from '../components/InlineAction';
import { PracticumHeader } from '../components/PracticumHeader';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { SyncStatusBanner } from '../components/SyncStatusBanner';
import { practicumErrorMessage } from '../errors';
import { usePracticumClass, useSchedules, useSessions } from '../hooks';
import { timestampDateLabel, timestampTimeLabel } from '../session-view';
import { colors, fontWeights, radius, spacing, typography } from '../theme';
import type { PracticumSchedule, PracticumSessionStatus } from '../types';

const STATUS_META: Record<
  PracticumSessionStatus,
  { label: string; tone: 'info' | 'success' | 'neutral' | 'danger' }
> = {
  scheduled: { label: 'Belum Dibuka', tone: 'info' },
  open: { label: 'Dibuka', tone: 'success' },
  closed: { label: 'Ditutup', tone: 'neutral' },
  cancelled: { label: 'Dibatalkan', tone: 'danger' },
};

export function ScheduleListScreen({ classId }: { classId: string }) {
  const router = useRouter();
  const classState = usePracticumClass(classId);
  const schedules = useSchedules(classId);
  const sessions = useSessions(classId);
  const [pendingArchive, setPendingArchive] = useState<PracticumSchedule | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace(`/kelas/${classId}`);
  }

  function openCreate() {
    router.push(`/kelas/${classId}/jadwal/new`);
  }

  function openEdit(scheduleId: string) {
    router.push(`/kelas/${classId}/jadwal/${scheduleId}/edit`);
  }

  function openDetail(scheduleId: string) {
    router.push(`/sesi/${scheduleId}`);
  }

  function openRecap(scheduleId: string) {
    router.push(`/sesi/${scheduleId}/rekap`);
  }

  async function archive() {
    if (!pendingArchive || busyId) return;
    setBusyId(pendingArchive.id);
    setActionError('');
    try {
      await getPracticumRepository().archiveSchedule(pendingArchive.id);
      setPendingArchive(null);
      await schedules.reload();
      await sessions.reload();
    } catch (cause) {
      setActionError(practicumErrorMessage(cause));
      setPendingArchive(null);
    } finally {
      setBusyId(null);
    }
  }

  const sessionByScheduleId = new Map(
    sessions.items.map((session) => [session.scheduleId, session]),
  );
  const loading =
    (classState.status === 'loading' || schedules.status === 'loading') &&
    schedules.items.length === 0;
  const error = classState.error ?? schedules.error;

  return (
    <View style={styles.screen}>
      <PracticumHeader
        eyebrow="Asisten"
        title="Kelola Jadwal"
        subtitle={classState.item?.className ?? 'Jadwal praktikum kelas.'}
        onBack={goBack}
      />

      <SyncStatusBanner
        error={classState.syncError ?? schedules.syncError ?? sessions.syncError}
        fromCache={classState.fromCache || schedules.fromCache || sessions.fromCache}
        onRetry={() => {
          classState.retrySync();
          schedules.retrySync();
          sessions.retrySync();
        }}
      />

      {loading ? <LoadingState message="Memuat jadwal…" /> : null}

      {!loading && error ? (
        <ErrorState
          message={error}
          onRetry={() => {
            void classState.reload();
            void schedules.reload();
            void sessions.reload();
          }}
        />
      ) : null}

      {!loading && !error && schedules.status === 'ready' ? (
        <FlatList
          data={schedules.items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            schedules.items.length === 0 && styles.emptyList,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => {
            const session = sessionByScheduleId.get(item.id);
            const meta = STATUS_META[session?.status ?? 'scheduled'];
            return (
              <View style={styles.card}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Buka detail jadwal ${item.title}`}
                  onPress={() => openDetail(item.id)}
                  style={({ pressed }) => [styles.cardMain, pressed && styles.pressed]}
                >
                  <View style={styles.topRow}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Badge label={meta.label} tone={meta.tone} />
                  </View>
                  <Text style={styles.meta}>
                    {timestampDateLabel(item.startAt)} · {timestampTimeLabel(item.startAt)} -{' '}
                    {timestampTimeLabel(item.endAt)}
                  </Text>
                  <Text style={styles.meta}>{item.location}</Text>
                </Pressable>
                <View style={styles.actions}>
                  <InlineAction
                    label="Kelola Presensi"
                    variant="primary"
                    onPress={() => openDetail(item.id)}
                  />
                  <InlineAction label="Rekap" onPress={() => openRecap(item.id)} />
                  <InlineAction label="Edit" onPress={() => openEdit(item.id)} />
                  <InlineAction
                    label="Arsip"
                    variant="danger"
                    disabled={busyId === item.id}
                    onPress={() => setPendingArchive(item)}
                  />
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              title="Belum ada jadwal"
              message="Tambahkan jadwal pertemuan praktikum untuk kelas ini."
              actionLabel="Tambah Jadwal"
              onAction={openCreate}
            />
          }
          ListFooterComponent={
            schedules.items.length > 0 ? (
              <View style={styles.footer}>
                <ActionButton title="Tambah Jadwal" onPress={openCreate} />
              </View>
            ) : undefined
          }
          showsVerticalScrollIndicator={false}
        />
      ) : null}

      {actionError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {actionError}
        </Text>
      ) : null}

      <ConfirmationModal
        visible={!!pendingArchive}
        eyebrow="KONFIRMASI ARSIP"
        title="Arsipkan jadwal ini?"
        description={`Jadwal ${pendingArchive?.title ?? ''} akan diarsipkan. Riwayat presensi tetap tersimpan.`}
        confirmLabel="Arsipkan Jadwal"
        onConfirm={() => {
          void archive();
        }}
        onCancel={() => setPendingArchive(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  separator: { height: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardMain: { gap: spacing.sm },
  pressed: { opacity: 0.85 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardTitle: {
    flex: 1,
    color: colors.text,
    fontSize: typography.bodyLarge,
    fontWeight: fontWeights.bold,
  },
  meta: {
    color: colors.textMuted,
    fontSize: typography.body,
  },
  actions: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  footer: { marginTop: spacing.lg },
  error: {
    color: colors.danger,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    fontSize: typography.body,
  },
});
