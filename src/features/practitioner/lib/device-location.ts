import { useCallback, useEffect, useRef, useState } from 'react';

export type DeviceLocationCoordinates = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
};

export type DeviceLocationState =
  | { status: 'loading'; coordinates: null; message: string }
  | { status: 'ready'; coordinates: DeviceLocationCoordinates; message: string }
  | { status: 'permission-denied'; coordinates: null; message: string }
  | { status: 'services-off'; coordinates: null; message: string }
  | { status: 'network-off'; coordinates: null; message: string }
  | { status: 'location-unavailable'; coordinates: null; message: string }
  | { status: 'native-unavailable'; coordinates: null; message: string };

export function isDeviceLocationReady(state: DeviceLocationState): boolean {
  return state.status === 'ready';
}

export function isPresensiDisabledByLocation(state: DeviceLocationState): boolean {
  return state.status !== 'ready';
}

export function useDeviceLocation() {
  const active = useRef(true);
  const sequence = useRef(0);
  const [state, setState] = useState<DeviceLocationState>({
    status: 'loading',
    coordinates: null,
    message: 'Memuat koordinat perangkat...',
  });

  const refresh = useCallback(async () => {
    const currentSequence = ++sequence.current;
    setState({
      status: 'loading',
      coordinates: null,
      message: 'Memuat koordinat perangkat...',
    });

    try {
      const Location = await import('expo-location');
      const Network = await import('expo-network');
      const network = await Network.getNetworkStateAsync();
      if (!active.current || currentSequence !== sequence.current) return;
      if (network.isConnected === false || network.isInternetReachable === false) {
        setState({
          status: 'network-off',
          coordinates: null,
          message: 'Koneksi jaringan bermasalah. Aktifkan Wi-Fi atau data seluler, lalu periksa ulang lokasi.',
        });
        return;
      }

      let permission = await Location.getForegroundPermissionsAsync();
      if (!active.current || currentSequence !== sequence.current) return;
      if (!permission.granted) {
        permission = await Location.requestForegroundPermissionsAsync();
      }
      if (!active.current || currentSequence !== sequence.current) return;
      if (!permission.granted) {
        setState({
          status: 'permission-denied',
          coordinates: null,
          message: 'Izin lokasi ditolak. Aktifkan izin lokasi aplikasi untuk melakukan presensi.',
        });
        return;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!active.current || currentSequence !== sequence.current) return;
      if (!servicesEnabled) {
        setState({
          status: 'services-off',
          coordinates: null,
          message: 'GPS atau layanan lokasi perangkat mati. Aktifkan layanan lokasi, lalu periksa ulang.',
        });
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        mayShowUserSettingsDialog: true,
      });
      if (!active.current || currentSequence !== sequence.current) return;
      const { latitude, longitude, accuracy } = position.coords;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        setState({
          status: 'location-unavailable',
          coordinates: null,
          message: 'Koordinat belum terbaca. Tunggu sinyal lokasi stabil, lalu periksa ulang.',
        });
        return;
      }
      setState({
        status: 'ready',
        coordinates: {
          latitude,
          longitude,
          accuracy: Number.isFinite(accuracy) ? accuracy : null,
        },
        message: 'Koordinat perangkat berhasil dibaca.',
      });
    } catch (error) {
      if (!active.current || currentSequence !== sequence.current) return;
      const text = error instanceof Error ? error.message : String(error);
      setState({
        status: /ExpoLocation|native module/i.test(text)
          ? 'native-unavailable'
          : 'location-unavailable',
        coordinates: null,
        message: /ExpoLocation|native module/i.test(text)
          ? 'Modul lokasi belum tersedia. Gunakan build aplikasi terbaru yang menyertakan expo-location.'
          : 'Koordinat belum dapat dibaca. Periksa GPS dan jaringan, lalu periksa ulang lokasi.',
      });
    }
  }, []);

  useEffect(() => {
    active.current = true;
    queueMicrotask(() => {
      if (active.current) void refresh();
    });
    return () => {
      active.current = false;
    };
  }, [refresh]);

  return { state, refresh };
}
