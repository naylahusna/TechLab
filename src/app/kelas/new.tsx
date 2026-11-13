import { AssistantRoute, ClassFormScreen } from '../../features/practicum';

export default function NewClassRoute() {
  return (
    <AssistantRoute>
      <ClassFormScreen mode="create" />
    </AssistantRoute>
  );
}
