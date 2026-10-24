import { Redirect, useLocalSearchParams } from 'expo-router';

import { useRole } from '../core/role-context';
import { isRole } from '../core/roles';
import { IdentitySelectionScreen } from '../features/auth/IdentitySelectionScreen';

export default function IdentityRoute() {
  const { role } = useLocalSearchParams<{ role?: string | string[] }>();
  const { currentUserId } = useRole();
  if (currentUserId) return <Redirect href="/beranda" />;
  if (!isRole(role)) return <Redirect href="/" />;
  return <IdentitySelectionScreen key={role} role={role} />;
}
