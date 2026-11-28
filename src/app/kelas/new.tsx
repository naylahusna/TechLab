import { AssistantRoute, ClassFormScreen } from '../../features/practicum';

export default function NewClassRoute() {
  return (
    <AssistantRoute access="aslab">
      <ClassFormScreen mode="create" />
    </AssistantRoute>
  );
}
