import { Redirect, useLocalSearchParams } from 'expo-router';

import { AssistantRoute, ScheduleFormScreen } from '../../../../features/practicum';

export default function NewScheduleRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  if (typeof id !== 'string' || !id) return <Redirect href="/kelas" />;
  return (
    <AssistantRoute>
      <ScheduleFormScreen classId={id} mode="create" />
    </AssistantRoute>
  );
}
