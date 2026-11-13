import { Redirect, useLocalSearchParams } from 'expo-router';

import { AssistantRoute, ParticipantListScreen } from '../../../features/practicum';

export default function ParticipantsRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  if (typeof id !== 'string' || !id) return <Redirect href="/kelas" />;
  return (
    <AssistantRoute>
      <ParticipantListScreen classId={id} />
    </AssistantRoute>
  );
}
