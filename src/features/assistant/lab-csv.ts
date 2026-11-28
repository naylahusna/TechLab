import { validateLabLocation } from './lab-location-policy';

export const labCsvHeaders = ['name', 'building', 'floor', 'latitude', 'longitude', 'radiusMeters', 'plusCode'] as const;

function decimal(value: string, key: string): number {
  if (!/^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(value)) {
    throw new Error(key + ' harus berupa angka desimal.');
  }
  return Number(value.replace(',', '.'));
}

export function parseLabRow(values: Record<string, string>) {
  const fields = Object.fromEntries(labCsvHeaders.map((key) => [key, values[key]?.trim() ?? '']));
  return validateLabLocation({
    name: fields.name, building: fields.building, plusCode: fields.plusCode,
    floor: fields.floor ? decimal(fields.floor, 'floor') : null,
    latitude: decimal(fields.latitude, 'latitude'), longitude: decimal(fields.longitude, 'longitude'),
    radiusMeters: decimal(fields.radiusMeters, 'radiusMeters'),
  });
}
