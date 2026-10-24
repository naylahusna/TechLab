import { useRouter } from 'expo-router';

import { useDemo, selectMySessions } from '../../core';
import { AssistantJadwalScreen, toAssistantSessionItem } from '../../features/assistant';
import { NavigationLandingScreen } from '../../features/navigation/NavigationLandingScreen';
import { JadwalScreen } from '../../features/practitioner';
import { toSessionListItem } from '../../features/practitioner/lib/argamapping';

export default function ScheduleRoute() {
  const demo = useDemo();
  const router = useRouter();

  if (!demo.currentUser) {
    return <NavigationLandingScreen page="jadwal" />;
  }

  if (demo.currentUser.role === 'asisten') {
    const assistantSessions = selectMySessions(demo).map(toAssistantSessionItem);

    return (
      <AssistantJadwalScreen
        sessions={assistantSessions}
        assistantName={demo.currentUser.name}
        assistantInitials={demo.currentUser.initials}
        onOpenSession={(sessionId) => router.push(`/sesi/${sessionId}`)}
      />
    );
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
