import { NavigationLandingScreen } from '../../features/navigation/NavigationLandingScreen';
import { AssistantScheduleScreen } from '../../features/assistant/AssistantScheduleScreen';
import { useRole } from '../../core/role-context';

export default function ScheduleRoute() {
  const { currentRole } = useRole();
  if (currentRole === 'asisten') return <AssistantScheduleScreen />;
  return <NavigationLandingScreen page="jadwal" />;
}
