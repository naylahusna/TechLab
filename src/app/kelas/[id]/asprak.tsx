import { Redirect, useLocalSearchParams } from 'expo-router';
import { AsprakAssignmentScreen } from '../../../features/admin/AsprakAssignmentScreen';
import { AssistantRoute } from '../../../features/practicum';

export default function AsprakRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  if (typeof id !== 'string' || !id) return <Redirect href="/kelas" />;
  return <AssistantRoute access="aslab"><AsprakAssignmentScreen classId={id} /></AssistantRoute>;
}
