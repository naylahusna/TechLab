import { Redirect, useLocalSearchParams } from 'expo-router';

import { AssistantRoute, ClassDetailScreen } from '../../../features/practicum';

export default function ClassDetailRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  if (typeof id !== 'string' || !id) return <Redirect href="/kelas" />;
  return (
    <AssistantRoute access="staff">
      <ClassDetailScreen classId={id} />
    </AssistantRoute>
  );
}
