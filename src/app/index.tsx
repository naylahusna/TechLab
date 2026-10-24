import { Redirect } from 'expo-router';

import { useRole } from '../core/role-context';
import { RoleSelectionScreen } from '../features/auth/RoleSelectionScreen';

export default function Index() {
  const { currentUserId } = useRole();
  if (currentUserId) return <Redirect href="/beranda" />;
  return <RoleSelectionScreen />;
}
