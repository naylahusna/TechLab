import { Redirect, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useAuth } from '../../features/auth/AuthProvider';
import { AssistantJadwalScreen } from '../../features/assistant';
import { JadwalScreen } from '../../features/practitioner';
import { useScheduleOverview } from '../../features/practicum';
import { ErrorState, LoadingState } from '../../features/practicum/components/StateViews';
import { initialsFor } from '../../features/practicum/profile-view';
import {
  toAssistantSessionItem,
  toPractitionerSessionListItem,
} from '../../features/practicum/session-view';
import { colors } from '../../theme/tokens';

export default function ScheduleRoute() {
  const auth = useAuth();
  const router = useRouter();
  const overview = useScheduleOverview();

  if (!auth.profile) return <Redirect href="/" />;

  if (overview.status === 'loading') {
    return (
      <View style={styles.screen}>
        <LoadingState message="Memuat jadwal…" />
      </View>
    );
  }

  if (overview.status === 'error') {
    return (
      <View style={styles.screen}>
        <ErrorState
          message={overview.error ?? 'Tidak dapat memuat jadwal.'}
          onRetry={overview.reload}
        />
      </View>
    );
  }

  const classById = new Map(overview.classes.map((item) => [item.id, item]));
  const scheduleById = new Map(overview.schedules.map((item) => [item.id, item]));

  if (auth.profile.role === 'asisten') {
    const sessions = overview.sessions.flatMap((session) => {
      const classItem = classById.get(session.classId);
      if (!classItem) return [];
      return [
        toAssistantSessionItem(
          session,
          classItem,
          scheduleById.get(session.scheduleId) ?? null,
        ),
      ];
    });

    return (
      <AssistantJadwalScreen
        sessions={sessions}
        assistantName={auth.profile.name}
        assistantInitials={initialsFor(auth.profile.name)}
        onOpenSession={(sessionId) => router.push(`/sesi/${sessionId}`)}
        onManageClasses={() => router.push('/kelas')}
      />
    );
  }

  const sessions = overview.sessions.flatMap((session) => {
    const classItem = classById.get(session.classId);
    if (!classItem) return [];
    return [
      toPractitionerSessionListItem(
        session,
        classItem,
        scheduleById.get(session.scheduleId) ?? null,
      ),
    ];
  });

  return (
    <JadwalScreen
      sessions={sessions}
      praktikanName={auth.profile.name}
      praktikanInitials={initialsFor(auth.profile.name)}
      onOpenSession={(sessionId) => router.push(`/sesi/${sessionId}`)}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
});
