import { Redirect, useLocalSearchParams } from 'expo-router';

import { AssistantRoute, ClassFormScreen } from '../../../features/practicum';

export default function EditClassRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  if (typeof id !== 'string' || !id) return <Redirect href="/kelas" />;
  return (
    <AssistantRoute>
      <ClassFormScreen mode="edit" classId={id} />
    </AssistantRoute>
  );
}
