import { Redirect, useLocalSearchParams } from 'expo-router';

import { AssistantRoute, RecapScreen } from '../../../features/practicum';

export default function RecapRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  if (typeof id !== 'string' || !id) return <Redirect href="/jadwal" />;
  return (
    <AssistantRoute>
      <RecapScreen sessionId={id} />
    </AssistantRoute>
  );
}
