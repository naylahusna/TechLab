import { useCallback } from 'react';

import { useAuth } from '../auth/AuthProvider';
import { getPracticumRepository } from '../practicum/client';
import type { LabActivityData } from './lab-activity';
import { useMapSubscription } from './useMapSubscription';

export function useLabActivity() {
  const { profile } = useAuth();
  const uid = profile?.role === 'admin' ? undefined : profile?.uid;
  const canAssist = profile?.role === 'asisten';
  const subscribe = useCallback((
    onData: (data: LabActivityData, fromCache: boolean) => void,
    onError: (error: Error) => void,
  ) => {
    if (uid) return getPracticumRepository().subscribeToMapActivity(uid, canAssist, onData, onError);
  }, [uid, canAssist]);

  return useMapSubscription(subscribe);
}
