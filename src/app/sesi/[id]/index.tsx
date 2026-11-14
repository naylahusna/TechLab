import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useAuth } from '../../../features/auth/AuthProvider';
import { AssistantSessionDetailScreen } from '../../../features/assistant';
import {
  getPracticumRepository,
  practicumErrorMessage,
  useSessionDetail,
} from '../../../features/practicum';
import { PracticumHeader } from '../../../features/practicum/components/PracticumHeader';
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../features/practicum/components/StateViews';
import { SyncStatusBanner } from '../../../features/practicum/components/SyncStatusBanner';
import {
  toAssistantParticipants,
  toAssistantSessionItem,
  toAttendanceSummary,
  toPractitionerSessionDetail,
  toPraktikanIdentity,
} from '../../../features/practicum/session-view';
import { SessionDetailScreen } from '../../../features/practitioner';
import { colors } from '../../../theme/tokens';

export default function SesiRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const auth = useAuth();
  const router = useRouter();
  const sessionId = typeof id === 'string' ? id : undefined;
  const detail = useSessionDetail(sessionId);

  if (!auth.profile) return <Redirect href="/" />;
  if (!sessionId) return <Redirect href="/jadwal" />;

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/jadwal');
  }

  if (detail.status === 'loading') {
    return (
      <View style={styles.screen}>
        <PracticumHeader title="Detail Sesi" onBack={goBack} />
        <LoadingState message="Memuat sesi…" />
      </View>
    );
  }

  if (detail.status === 'error') {
    return (
      <View style={styles.screen}>
        <PracticumHeader title="Detail Sesi" onBack={goBack} />
        <ErrorState
          message={detail.error ?? 'Terjadi kesalahan.'}
          onRetry={detail.reload}
        />
      </View>
    );
  }

  if (detail.status === 'missing' || !detail.session || !detail.classItem) {
    return (
      <View style={styles.screen}>
        <PracticumHeader title="Detail Sesi" onBack={goBack} />
        <EmptyState
          title="Sesi tidak ditemukan"
          message="Sesi ini tidak tersedia atau kamu tidak memiliki akses."
          actionLabel="Kembali ke Jadwal"
          onAction={() => router.replace('/jadwal')}
        />
      </View>
    );
  }

  const session = detail.session;
  const classItem = detail.classItem;
  const schedule = detail.schedule;
  const userId = auth.profile.uid;

  if (auth.profile.role === 'asisten') {
    const assistantSession = toAssistantSessionItem(session, classItem, schedule);
    const participants = toAssistantParticipants(
      detail.participants,
      detail.attendance,
      session.status,
    );
    const summary = toAttendanceSummary(detail.participants, detail.attendance);

    async function openSession() {
      try {
        await getPracticumRepository().openSession(session.id, userId);
        await detail.reload();
        return { ok: true, message: 'Sesi dibuka.' };
      } catch (cause) {
        return { ok: false, message: practicumErrorMessage(cause) };
      }
    }

    async function closeSession() {
      try {
        await getPracticumRepository().closeSession(session.id, userId);
        await detail.reload();
        return { ok: true, message: 'Sesi ditutup.' };
      } catch (cause) {
        return { ok: false, message: practicumErrorMessage(cause) };
      }
    }

    return (
      <View style={styles.screen}>
        <SyncStatusBanner
          error={detail.syncError}
          fromCache={detail.fromCache}
          onRetry={detail.retrySync}
        />
        <AssistantSessionDetailScreen
          session={assistantSession}
          summary={summary}
          participants={participants}
          onBack={goBack}
          onOpenSession={openSession}
          onCloseSession={closeSession}
          onOpenRecap={() => router.push(`/sesi/${session.id}/rekap`)}
        />
      </View>
    );
  }

  const practitionerSession = toPractitionerSessionDetail(
    session,
    classItem,
    schedule,
    detail.attendance,
    userId,
  );
  const praktikan = toPraktikanIdentity(auth.profile);

  async function confirmAttendance() {
    try {
      await getPracticumRepository().recordAttendance(session.id, userId);
      await detail.reload();
      return { ok: true as const };
    } catch (cause) {
      return { ok: false as const, reason: practicumErrorMessage(cause) };
    }
  }

  return (
    <View style={styles.screen}>
      <SyncStatusBanner
        error={detail.syncError}
        fromCache={detail.fromCache}
        onRetry={detail.retrySync}
      />
      <SessionDetailScreen
        session={practitionerSession}
        praktikan={praktikan}
        onBack={goBack}
        onConfirmAttendance={confirmAttendance}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
});
