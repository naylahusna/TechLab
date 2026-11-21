import { locationUnavailable, permissionDenied, type MapLocationWatcher } from './map-location-types';

export const watchMapLocation: MapLocationWatcher = (onPosition, onError) => {
  const geolocation = globalThis.navigator?.geolocation;
  if (!globalThis.isSecureContext || !geolocation) {
    onError('Lokasi browser membutuhkan HTTPS atau localhost.');
    return () => {};
  }

  const id = geolocation.watchPosition(
    ({ coords }) => onPosition({ latitude: coords.latitude, longitude: coords.longitude }),
    (error) => onError(error.code === 1 ? permissionDenied : locationUnavailable, error.code !== 1),
    { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
  );
  return () => geolocation.clearWatch(id);
};
