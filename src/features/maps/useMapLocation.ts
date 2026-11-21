import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { locationUnavailable, type MapLocationState } from './map-location-types';
import { watchMapLocation } from './watch-map-location';

export function useMapLocation() {
  const [state, setState] = useState<MapLocationState>({ status: 'idle', position: null });
  const restart = useRef<(() => void) | null>(null);

  useFocusEffect(useCallback(() => {
    let stop: (() => void) | undefined;

    function begin() {
      if (stop) return;
      let active = true;
      setState({ status: 'loading', position: null });
      const timeout = setTimeout(() => reportError(locationUnavailable), 20000);

      function reportError(message: string) {
        clearTimeout(timeout);
        if (active) setState({ status: 'error', position: null, message });
      }

      let removeWatcher = () => {};
      try {
        removeWatcher = watchMapLocation((position) => {
          if (!active || !Number.isFinite(position.latitude) || !Number.isFinite(position.longitude)
            || Math.abs(position.latitude) > 90 || Math.abs(position.longitude) > 180) return;
          clearTimeout(timeout);
          setState({ status: 'ready', position });
        }, reportError);
      } catch {
        reportError(locationUnavailable);
      }
      stop = () => {
        active = false;
        clearTimeout(timeout);
        removeWatcher();
      };
    }

    function stopCurrent() {
      stop?.();
      stop = undefined;
    }

    restart.current = () => {
      if (AppState.currentState === 'background') return;
      stopCurrent();
      begin();
    };
    const appState = AppState.addEventListener('change', (next) => {
      if (next === 'background') {
        stopCurrent();
        setState({ status: 'idle', position: null });
      } else if (next === 'active') {
        begin();
      }
    });
    if (AppState.currentState !== 'background') begin();
    return () => {
      appState?.remove();
      stopCurrent();
      restart.current = null;
    };
  }, []));

  return { state, retry: () => restart.current?.() };
}
