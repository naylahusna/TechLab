import { useLocalSearchParams } from 'expo-router';
import { PermissionFormScreen } from '../../features/permission/PermissionFormScreen';
export default function NewPermissionRoute() {
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  return (
    <PermissionFormScreen
      initialSessionId={typeof sessionId === 'string' ? sessionId : undefined}
    />
  );
}
