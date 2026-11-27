import { AssistantRoute, ClassListScreen } from '../../features/practicum';

export default function KelasRoute() {
  return (
    <AssistantRoute access="staff">
      <ClassListScreen />
    </AssistantRoute>
  );
}
