import { useState } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ConfirmationModal } from '../../../components/ConfirmationModal';
import { Text } from '../../../components/Text';
import { useAuth } from '../../auth/AuthProvider';
import { Badge } from '../../practitioner/components/Badge';
import { getPracticumRepository } from '../client';
import { InlineAction } from '../components/InlineAction';
import { PracticumHeader } from '../components/PracticumHeader';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { SyncStatusBanner } from '../components/SyncStatusBanner';
import { practicumErrorMessage } from '../errors';
import { usePracticumClass, useSchedules, useSessions } from '../hooks';
import { sessionTimeRange, timestampDateLabel } from '../session-view';
import { colors, fontWeights, radius, spacing, typography } from '../theme';
import type { PracticumSession } from '../types';

type PendingAction = {
  action: 'open' | 'close' | 'cancel';
  session: PracticumSession;
};

const STATUS_META = {
  scheduled: { label: 'Belum Dibuka', tone: 'info' as const },
  open: { label: 'Dibuka', tone: 'success' as const },
  closed: { label: 'Ditutup', tone: 'neutral' as const },
  cancelled: { label: 'Dibatalkan', tone: 'danger' as const },
};

const ACTION_TEXT = {
  open: {
    title: 'Buka sesi ini?',
    description: 'Praktikan terdaftar dapat mulai melakukan presensi.',
    confirm: 'Buka Sesi',
  },
  close: {
    title: 'Tutup sesi ini?',
    description: 'Presensi baru tidak dapat dilakukan setelah sesi ditutup.',
    confirm: 'Tutup Sesi',
  },
  cancel: {
    title: 'Batalkan sesi ini?',
    description: 'Sesi akan ditandai dibatalkan dan tidak menerima presensi.',
    confirm: 'Batalkan Sesi',
  },
};

export function SessionListScreen({ classId }: { classId: string }) {
  const router = useRouter();
  const auth = useAuth();
  const classState = usePracticumClass(classId);
  const sessions = useSessions(classId);
  const schedules = useSchedules(classId);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace(`/kelas/${classId}`);
  }

  const scheduleById = new Map(schedules.items.map((item) => [item.id, item]));
  const loading =
    (classState.status === 'loading' || sessions.status === 'loading') &&
    sessions.items.length === 0;
  const error = classState.error ?? sessions.error;

  async function confirmAction() {
    if (!pending || busyId || !auth.profile) return;
    const actorId = auth.profile.uid;
    setBusyId(pending.session.id);
    setActionError('');
    try {
      const repository = getPracticumRepository();
      if (pending.action === 'open')
        await repository.openSession(pending.session.id, actorId);
      if (pending.action === 'close')
        await repository.closeSession(pending.session.id, actorId);
      if (pending.action === 'cancel')
        await repository.cancelSession(pending.session.id, actorId);
      setPending(null);
      await sessions.reload();
    } catch (cause) {
      setActionError(practicumErrorMessage(cause));
      setPending(null);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <View style={styles.screen}>
      <PracticumHeader
        eyebrow="Asisten"
        title="Kelola Sesi"
        subtitle={classState.item?.className ?? 'Sesi praktikum kelas.'}
        onBack={goBack}
      />

      <SyncStatusBanner
        error={classState.syncError ?? sessions.syncError}
        fromCache={classState.fromCache || sessions.fromCache}
        onRetry={() => {
          classState.retrySync();
          sessions.retrySync();
        }}
      />

      {loading ? <LoadingState message="Memuat sesi…" /> : null}

      {!loading && error ? (
        <ErrorState
          message={error}
          onRetry={() => {
            void classState.reload();
            void sessions.reload();
          }}
        />
      ) : null}

      {!loading && !error && sessions.status === 'ready' ? (
        <FlatList
          data={sessions.items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            sessions.items.length === 0 && styles.emptyList,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => {
            const meta = STATUS_META[item.status];
            const schedule = scheduleById.get(item.scheduleId);
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Buka detail sesi ${schedule?.title ?? item.id}`}
                onPress={() => router.push(`/sesi/${item.id}`)}
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              >
                <View style={styles.topRow}>
                  <Text style={styles.cardTitle}>
                    {schedule?.title ?? 'Sesi Praktikum'}
                  </Text>
                  <Badge label={meta.label} tone={meta.tone} />
                </View>
                <Text style={styles.meta}>
                  {timestampDateLabel(item.startAt)} · {sessionTimeRange(item)}
                </Text>
                <Text style={styles.meta}>{item.studentIds.length} peserta</Text>
                <View style={styles.actions}>
                  {item.status === 'scheduled' ? (
                    <InlineAction
                      label="Buka"
                      variant="primary"
                      disabled={busyId === item.id}
                      onPress={() => setPending({ action: 'open', session: item })}
                    />
                  ) : null}
                  {item.status === 'open' ? (
                    <InlineAction
                      label="Tutup"
                      variant="primary"
                      disabled={busyId === item.id}
                      onPress={() => setPending({ action: 'close', session: item })}
                    />
                  ) : null}
                  {(item.status === 'scheduled' || item.status === 'open') ? (
                    <InlineAction
                      label="Batalkan"
                      variant="danger"
                      disabled={busyId === item.id}
                      onPress={() => setPending({ action: 'cancel', session: item })}
                    />
                  ) : null}
                  <InlineAction
                    label="Rekap"
                    onPress={() => router.push(`/sesi/${item.id}/rekap`)}
                  />
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              title="Belum ada sesi"
              message="Buat sesi dari jadwal terlebih dahulu, lalu kelola pembukaan dan penutupannya di sini."
              actionLabel="Buka Jadwal"
              onAction={() => router.push(`/kelas/${classId}/jadwal`)}
            />
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
        visible={!!pending}
        eyebrow="KONFIRMASI SESI"
        title={pending ? ACTION_TEXT[pending.action].title : ''}
        description={pending ? ACTION_TEXT[pending.action].description : ''}
        confirmLabel={pending ? ACTION_TEXT[pending.action].confirm : ''}
        onConfirm={() => {
          void confirmAction();
        }}
        onCancel={() => setPending(null)}
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
  error: {
    color: colors.danger,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    fontSize: typography.body,
  },
});
