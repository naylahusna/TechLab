import { Redirect, useLocalSearchParams } from 'expo-router';

import { AssistantRoute, ScheduleListScreen } from '../../../../features/practicum';

export default function SchedulesRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  if (typeof id !== 'string' || !id) return <Redirect href="/kelas" />;
  return (
    <AssistantRoute>
      <ScheduleListScreen classId={id} />
    </AssistantRoute>
  );
}
