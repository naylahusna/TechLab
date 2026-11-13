import { Redirect, useLocalSearchParams } from 'expo-router';

import { AssistantRoute, SessionListScreen } from '../../../features/practicum';

export default function SessionsRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  if (typeof id !== 'string' || !id) return <Redirect href="/kelas" />;
  return (
    <AssistantRoute>
      <SessionListScreen classId={id} />
    </AssistantRoute>
  );
}
