import { useRouter } from 'expo-router';

import { useDemo, selectMySessions } from '../../core';
import { AssistantJadwalScreen, toAssistantSessionItem } from '../../features/assistant';
import { selectAssistantSessions } from '../../features/assistant/session-view';
import { NavigationLandingScreen } from '../../features/navigation/NavigationLandingScreen';
import { JadwalScreen } from '../../features/practitioner';
import { toSessionListItem } from '../../features/practitioner/lib/argamapping';

export default function ScheduleRoute() {
  const demo = useDemo();
  const router = useRouter();

  if (demo.currentUser?.role === 'asisten') {
    const sessions = selectAssistantSessions(demo).map(({ session }) =>
      toAssistantSessionItem(session),
    );

    return (
      <AssistantJadwalScreen
        sessions={sessions}
        assistantName={demo.currentUser.name}
        assistantInitials={demo.currentUser.initials}
        onOpenSession={(sessionId) => router.push(`/sesi/${sessionId}`)}
      />
    );
  }

  if (demo.currentUser?.role !== 'praktikan') {
    return <NavigationLandingScreen page="jadwal" />;
  }

  const sessions = selectMySessions(demo).map(toSessionListItem);

  return (
    <JadwalScreen
      sessions={sessions}
      praktikanName={demo.currentUser.name}
      praktikanInitials={demo.currentUser.initials}
      onOpenSession={(sessionId) => router.push(`/sesi/${sessionId}`)}
    />
  );
}
