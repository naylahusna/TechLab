import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { getFirebaseFirestore } from '../../services/firebase/firestore';
import { createPermissionRepository } from './repository';
import { permissionError, permissionReadVisibility, type Permission } from './model';

let repository: ReturnType<typeof createPermissionRepository> | undefined;
export function getPermissionRepository() {
  return (repository ??= createPermissionRepository(getFirebaseFirestore()));
}
type Resource<T> = {
  status: 'loading' | 'ready' | 'error';
  data: T;
  error: string | null;
  cached: boolean;
  key: string;
};
export function usePermissions() {
  const { profile } = useAuth();
  const [epoch, setEpoch] = useState(0);
  const key = `${profile?.uid}:${profile?.role}:${epoch}`;
  const [state, setState] = useState<Resource<Permission[]>>({
    status: 'loading',
    data: [],
    error: null,
    cached: false,
    key,
  });
  const actor = useMemo(() => (profile ? { ...profile } : null), [profile]);
  useEffect(() => {
    if (!actor) return;
    let active = true;
    const fail = (error: unknown) => {
      if (active)
        setState({ status: 'error', data: [], error: permissionError(error), cached: false, key });
    };
    let stop: (() => void) | undefined;
    try {
      stop = getPermissionRepository().subscribeList(
        actor,
        (data, cached) => {
          if (active) setState({ status: 'ready', data, error: null, cached, key });
        },
        fail,
      );
    } catch (error) {
      fail(error);
    }
    return () => {
      active = false;
      stop?.();
    };
  }, [actor, key, epoch]);
  return {
    ...(state.key === key
      ? state
      : { status: 'loading' as const, data: [], error: null, cached: false }),
    retry: () => setEpoch((value) => value + 1),
  };
}
export function usePermission(id: string | undefined) {
  const { profile } = useAuth();
  const [epoch, setEpoch] = useState(0);
  const key = `${profile?.uid}:${profile?.role}:${id}:${epoch}`;
  const [state, setState] = useState<Resource<Permission | null>>({
    status: 'loading',
    data: null,
    error: null,
    cached: false,
    key,
  });
  useEffect(() => {
    if (!id || !profile) return;
    let active = true;
    let serverConfirmed = false;
    const fail = (error: unknown) => {
      if (active)
        setState({
          status: 'error',
          data: null,
          error: permissionError(error),
          cached: false,
          key,
        });
    };
    let stop: (() => void) | undefined;
    try {
      stop = getPermissionRepository().subscribeOne(
        id,
        (data, cached) => {
          if (!active) return;
          const visibility = permissionReadVisibility(profile.role, profile.uid, data?.userId, cached, serverConfirmed);
          if (visibility === 'deny') { fail(new Error('Pengajuan ini bukan milik akunmu.')); return; }
          if (visibility === 'wait') return;
          if (!cached) serverConfirmed = true;
          setState({ status: 'ready', data, error: null, cached, key });
        },
        fail,
      );
    } catch (error) {
      fail(error);
    }
    return () => {
      active = false;
      stop?.();
    };
  }, [id, profile, key, epoch]);
  return {
    ...(state.key === key
      ? state
      : { status: 'loading' as const, data: null, error: null, cached: false }),
    retry: () => setEpoch((value) => value + 1),
  };
}
