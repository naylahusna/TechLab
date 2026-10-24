import { Redirect, useLocalSearchParams } from 'expo-router';

import { useRole } from '../core/role-context';
import { isRole } from '../core/roles';
import { IdentitySelectionScreen } from '../features/auth/IdentitySelectionScreen';

export default function IdentityRoute() {
  const { role, mode } = useLocalSearchParams<{ role?: string | string[]; mode?: string }>();
  const { currentUserId } = useRole();
  const switching = mode === 'switch' && !!currentUserId;
  if (currentUserId && !switching) return <Redirect href="/beranda" />;
  if (!isRole(role)) return <Redirect href={currentUserId ? '/profil' : '/'} />;
  return <IdentitySelectionScreen key={`${role}-${switching}`} role={role} switching={switching} />;
}
