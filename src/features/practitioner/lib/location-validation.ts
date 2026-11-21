export type DeviceCoordinates = {
  latitude: number;
  longitude: number;
};

export type AttendanceLabLocation = {
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
};

export type LocationValidation =
  | { status: 'unavailable'; distanceMeters: null; message: string }
  | { status: 'inside'; distanceMeters: number; allowedRadiusMeters: number; message: string }
  | { status: 'outside'; distanceMeters: number; allowedRadiusMeters: number; message: string };

const EARTH_RADIUS_METERS = 6_371_000;

export function calculateDistanceMeters(
  from: DeviceCoordinates,
  to: DeviceCoordinates,
): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);

  const haversine =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2)
    + Math.cos(fromLatitude)
      * Math.cos(toLatitude)
      * Math.sin(longitudeDelta / 2)
      * Math.sin(longitudeDelta / 2);

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(haversine));
}

export function validateAttendanceLocation(
  device: DeviceCoordinates | null,
  lab: AttendanceLabLocation | null,
): LocationValidation {
  if (!device || !lab) {
    return {
      status: 'unavailable',
      distanceMeters: null,
      message: 'Koordinat perangkat atau lokasi laboratorium belum tersedia.',
    };
  }

  const distanceMeters = calculateDistanceMeters(device, lab);
  if (distanceMeters <= lab.radiusMeters) {
    return {
      status: 'inside',
      distanceMeters,
      allowedRadiusMeters: lab.radiusMeters,
      message: `Jarak ke lab ${Math.round(distanceMeters)} m · Batas radius ${lab.radiusMeters} m.`,
    };
  }

  return {
    status: 'outside',
    distanceMeters,
    allowedRadiusMeters: lab.radiusMeters,
    message: `Jarak ke lab ${Math.round(distanceMeters)} m · Batas radius ${lab.radiusMeters} m.`,
  };
}
