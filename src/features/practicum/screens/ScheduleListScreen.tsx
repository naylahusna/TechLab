import { useState } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';

import { ActionButton } from '../../../components/ActionButton';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import { Text } from '../../../components/Text';
import { useAuth } from '../../auth/AuthProvider';
import { getPracticumRepository } from '../client';
import { InlineAction } from '../components/InlineAction';
import { PracticumHeader } from '../components/PracticumHeader';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { SyncStatusBanner } from '../components/SyncStatusBanner';
import { practicumErrorMessage } from '../errors';
import { usePracticumClass, useSchedules } from '../hooks';
import { timestampDateLabel, timestampTimeLabel } from '../session-view';
import { colors, fontWeights, radius, spacing, typography } from '../theme';
import type { PracticumSchedule } from '../types';

export function ScheduleListScreen({ classId }: { classId: string }) {
  const router = useRouter();
  const auth = useAuth();
  const classState = usePracticumClass(classId);
  const schedules = useSchedules(classId);
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

  async function archive() {
    if (!pendingArchive || busyId) return;
    setBusyId(pendingArchive.id);
    setActionError('');
    try {
      await getPracticumRepository().archiveSchedule(pendingArchive.id);
      setPendingArchive(null);
      await schedules.reload();
    } catch (cause) {
      setActionError(practicumErrorMessage(cause));
      setPendingArchive(null);
    } finally {
      setBusyId(null);
    }
  }

  async function createSession(schedule: PracticumSchedule) {
    if (!auth.profile || busyId) return;
    setBusyId(schedule.id);
    setActionError('');
    try {
      await getPracticumRepository().createSessionFromSchedule(
        schedule.id,
        auth.profile.uid,
      );
      router.push(`/kelas/${classId}/sesi`);
    } catch (cause) {
      setActionError(practicumErrorMessage(cause));
    } finally {
      setBusyId(null);
    }
  }

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
        error={classState.syncError ?? schedules.syncError}
        fromCache={classState.fromCache || schedules.fromCache}
        onRetry={() => {
          classState.retrySync();
          schedules.retrySync();
        }}
      />

      {loading ? <LoadingState message="Memuat jadwal…" /> : null}

      {!loading && error ? (
        <ErrorState
          message={error}
          onRetry={() => {
            void classState.reload();
            void schedules.reload();
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
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.meta}>
                {timestampDateLabel(item.startAt)} · {timestampTimeLabel(item.startAt)} -{' '}
                {timestampTimeLabel(item.endAt)}
              </Text>
              <Text style={styles.meta}>{item.location}</Text>
              <View style={styles.actions}>
                <InlineAction
                  label={busyId === item.id ? 'Memproses…' : 'Buat Sesi'}
                  variant="primary"
                  disabled={busyId === item.id}
                  onPress={() => {
                    void createSession(item);
                  }}
                />
                <InlineAction label="Edit" onPress={() => openEdit(item.id)} />
                <InlineAction
                  label="Arsip"
                  variant="danger"
                  disabled={busyId === item.id}
                  onPress={() => setPendingArchive(item)}
                />
              </View>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              title="Belum ada jadwal"
              message="Tambahkan jadwal pertemuan agar sesi praktikum dapat dibuat."
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
        description={`Jadwal ${pendingArchive?.title ?? ''} akan diarsipkan. Sesi yang sudah ada tetap tersimpan.`}
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
  cardTitle: {
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
