import { Redirect, useLocalSearchParams } from 'expo-router';

import { AssistantRoute, ScheduleFormScreen } from '../../../../../features/practicum';

export default function EditScheduleRoute() {
  const { id, scheduleId } = useLocalSearchParams<{
    id?: string | string[];
    scheduleId?: string | string[];
  }>();
  if (typeof id !== 'string' || !id) return <Redirect href="/kelas" />;
  if (typeof scheduleId !== 'string' || !scheduleId)
    return <Redirect href={`/kelas/${id}/jadwal`} />;
  return (
    <AssistantRoute>
      <ScheduleFormScreen classId={id} mode="edit" scheduleId={scheduleId} />
    </AssistantRoute>
  );
}
