import { locationUnavailable, permissionDenied, type MapLocationWatcher } from './map-location-types';

export const watchMapLocation: MapLocationWatcher = (onPosition, onError) => {
  let cancelled = false;
  let subscription: { remove: () => void } | undefined;

  async function start() {
    const Location = await import('expo-location');
    if (cancelled) return;
    const enabled = await Location.hasServicesEnabledAsync();
    if (cancelled) return;
    if (!enabled) {
      onError('Layanan lokasi perangkat mati. Aktifkan lokasi, lalu coba lagi.');
      return;
    }

    let permission = await Location.getForegroundPermissionsAsync();
    if (cancelled) return;
    if (!permission.granted && permission.canAskAgain) {
      permission = await Location.requestForegroundPermissionsAsync();
    }
    if (cancelled) return;
    if (!permission.granted) {
      onError(permissionDenied);
      return;
    }

    const watcher = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 3, timeInterval: 1000 },
      ({ coords }) => {
        if (!cancelled) onPosition({ latitude: coords.latitude, longitude: coords.longitude });
      },
      () => {
        if (!cancelled) onError(locationUnavailable, true);
      },
    );
    if (cancelled) watcher.remove();
    else subscription = watcher;
  }

  void start().catch(() => {
    if (!cancelled) onError(locationUnavailable);
  });
  return () => {
    cancelled = true;
    subscription?.remove();
  };
};
