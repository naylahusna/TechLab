import { useRouter } from 'expo-router';

import { useDemo, selectMySessions } from '../../core';
import { NavigationLandingScreen } from '../../features/navigation/NavigationLandingScreen';
import { JadwalScreen } from '../../features/practitioner';
import { toSessionListItem } from '../../features/practitioner/lib/argamapping';

export default function ScheduleRoute() {
  const demo = useDemo();
  const router = useRouter();

  if (demo.currentUser?.role !== 'praktikan') {
    return <NavigationLandingScreen page="jadwal" />;
  }

  const sessions = selectMySessions(demo).map(toSessionListItem);

  return (
    <JadwalScreen
      sessions={sessions}
      onOpenSession={(sessionId) => router.push(`/sesi/${sessionId}`)}
    />
  );
}
