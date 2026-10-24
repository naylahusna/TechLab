import { Redirect, useLocalSearchParams } from 'expo-router';

import { useRole } from '../core/role-context';
import { RoleSelectionScreen } from '../features/auth/RoleSelectionScreen';

export default function Index() {
  const { currentUserId } = useRole();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const switching = mode === 'switch' && !!currentUserId;
  if (currentUserId && !switching) return <Redirect href="/beranda" />;
  return <RoleSelectionScreen key={switching ? 'switch' : 'initial'} switching={switching} />;
}
