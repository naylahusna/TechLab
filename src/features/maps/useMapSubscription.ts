import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { practicumErrorMessage } from '../practicum/errors';

type State<T> = { data: T | null; error: string | null; loading: boolean; fromCache: boolean };
type Subscribe<T> = (
  next: (data: T, fromCache: boolean) => void,
  error: (error: Error) => void,
) => (() => void) | undefined;

export function useMapSubscription<T>(subscribe: Subscribe<T>) {
  const [state, setState] = useState<State<T>>({ data: null, error: null, loading: true, fromCache: false });
  const restart = useRef<(() => void) | null>(null);

  useFocusEffect(useCallback(() => {
    let stop: (() => void) | undefined;
    function start(keepData: boolean) {
      stop?.();
      let active = true;
      setState((previous) => ({
        data: keepData ? previous.data : null,
        error: null, loading: true, fromCache: keepData && previous.fromCache,
      }));
      function receiveError(error: Error) {
        if (!active) return;
        const denied = (error as { code?: string }).code === 'permission-denied';
        setState((previous) => ({
          data: denied ? null : previous.data,
          error: practicumErrorMessage(error), loading: false,
          fromCache: !denied && previous.fromCache,
        }));
      }
      let unsubscribe: (() => void) | undefined;
      try {
        unsubscribe = subscribe((data, fromCache) => {
          if (active) setState({ data, error: null, loading: false, fromCache });
        }, receiveError);
      } catch (error) {
        receiveError(error instanceof Error ? error : new Error('Data Maps gagal dimuat.'));
      }
      stop = () => { active = false; unsubscribe?.(); };
    }

    restart.current = () => start(true);
    start(false);
    return () => {
      stop?.();
      restart.current = null;
    };
  }, [subscribe]));

  return { ...state, retry: () => restart.current?.() };
}
