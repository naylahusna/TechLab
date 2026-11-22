import type { PushState } from './device';
let state: PushState = 'loading';
const listeners = new Set<() => void>();
export const pushStatus = {
  getSnapshot: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  set(value: PushState) {
    state = value;
    listeners.forEach((listener) => listener());
  },
};
export const pushMessages: Record<PushState, string> = {
  loading: 'Memeriksa notifikasi perangkat…',
  ready:
    'Perangkat terdaftar untuk notifikasi. Pengiriman tetap bergantung pada jaringan dan pengaturan perangkat.',
  denied:
    'Notifikasi dinonaktifkan. Aktifkan izin notifikasi TechLab melalui pengaturan perangkat.',
  unsupported:
    'Push tersedia melalui aplikasi mobile development build. Kamu tetap dapat membaca pemberitahuan di dalam aplikasi.',
  error:
    'Notifikasi perangkat belum terhubung. Periksa koneksi dan coba lagi. Data praktikum tetap tersimpan.',
};
