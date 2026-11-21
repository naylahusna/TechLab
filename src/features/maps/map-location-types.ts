import type { MapCenter } from './map-viewport-model';

export type MapLocationState =
  | { status: 'idle' | 'loading'; position: null }
  | { status: 'ready'; position: MapCenter }
  | { status: 'stale'; position: MapCenter }
  | { status: 'error'; position: null; message: string };

export const permissionDenied = 'Izin lokasi ditolak. Izinkan akses lokasi untuk menampilkan posisi kamu.';
export const locationUnavailable = 'Posisi belum tersedia. Periksa layanan lokasi, lalu coba lagi.';

export type MapLocationWatcher = (
  onPosition: (position: MapCenter) => void,
  onError: (message: string, temporary?: boolean) => void,
) => () => void;
