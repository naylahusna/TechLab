import { Redirect, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../features/auth/AuthProvider';
import { PermissionDetailScreen } from '../../features/permission/PermissionDetailScreen';
export default function PermissionDetailRoute() {
  const { id, created } = useLocalSearchParams<{ id?: string; created?: string }>();
  const { profile } = useAuth();
  return typeof id === 'string' && profile ? (
    <PermissionDetailScreen key={`${profile.uid}:${id}`} id={id} created={created === '1'} />
  ) : (
    <Redirect href="/izin" />
  );
}
