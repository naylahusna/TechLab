import { useEffect, useState } from 'react';
import { getPermissionRepository } from './hooks';
import { permissionError } from './model';

type AttendanceState = {
  key: string;
  status: 'loading' | 'ready' | 'error';
  present: boolean;
  cached: boolean;
  error: string | null;
};

export function useSubmissionAttendance(sessionId: string | undefined, userId: string) {
  const key = `${sessionId}:${userId}`;
  const [epoch, setEpoch] = useState(0);
  const [state, setState] = useState<AttendanceState>({
    key: '',
    status: 'loading',
    present: false,
    cached: false,
    error: null,
  });
  useEffect(() => {
    if (!sessionId) return;
    let active = true;
    const fail = (error: unknown) => {
      if (active)
        setState({
          key,
          status: 'error',
          present: false,
          cached: false,
          error: permissionError(error),
        });
    };
    let stop: (() => void) | undefined;
    try {
      stop = getPermissionRepository().subscribeOwnAttendance(
        sessionId,
        userId,
        (present, cached) => {
          if (active) setState({ key, status: 'ready', present, cached, error: null });
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
  }, [sessionId, userId, key, epoch]);
  return {
    ...(state.key === key
      ? state
      : { status: 'loading' as const, present: false, cached: false, error: null }),
    retry: () => setEpoch((value) => value + 1),
  };
}
