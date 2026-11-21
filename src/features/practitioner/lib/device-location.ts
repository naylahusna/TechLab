import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import * as Network from 'expo-network';

export type DeviceCoordinates = {
  latitude: number;
  longitude: number;
};

export type DeviceLocationState =
  | { status: 'checking'; coordinates: null; message: string }
  | { status: 'ready'; coordinates: DeviceCoordinates; message: string }
  | { status: 'permission-denied'; coordinates: null; message: string }
  | { status: 'services-off'; coordinates: null; message: string }
  | { status: 'network-off'; coordinates: null; message: string }
  | { status: 'unavailable'; coordinates: null; message: string };

export function isDeviceLocationReady(state: DeviceLocationState): boolean {
  return state.status === 'ready';
}

export function useDeviceLocation() {
  const active = useRef(true);
  const requestSequence = useRef(0);
  const [state, setState] = useState<DeviceLocationState>({
    status: 'checking',
    coordinates: null,
    message: 'Meminta izin dan membaca koordinat perangkat...',
  });

  const refresh = useCallback(async () => {
    const sequence = ++requestSequence.current;
    setState({
      status: 'checking',
      coordinates: null,
      message: 'Meminta izin dan membaca koordinat perangkat...',
    });

    try {
      const network = await Network.getNetworkStateAsync();
      if (!active.current || sequence !== requestSequence.current) return;
      if (network.isConnected === false || network.isInternetReachable === false) {
        setState({
          status: 'network-off',
          coordinates: null,
          message: 'Koneksi jaringan terganggu. Aktifkan Wi-Fi atau data seluler, lalu coba lagi.',
        });
        return;
      }

      let permission = await Location.getForegroundPermissionsAsync();
      if (!active.current || sequence !== requestSequence.current) return;
      if (!permission.granted) {
        permission = await Location.requestForegroundPermissionsAsync();
      }
      if (!active.current || sequence !== requestSequence.current) return;
      if (!permission.granted) {
        setState({
          status: 'permission-denied',
          coordinates: null,
          message: 'Izin lokasi ditolak. Aktifkan izin lokasi untuk dapat mencatat presensi.',
        });
        return;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!active.current || sequence !== requestSequence.current) return;
      if (!servicesEnabled) {
        setState({
          status: 'services-off',
          coordinates: null,
          message: 'Layanan GPS/perangkat lokasi tidak aktif. Aktifkan lokasi perangkat, lalu coba lagi.',
        });
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        mayShowUserSettingsDialog: true,
      });
      if (!active.current || sequence !== requestSequence.current) return;
      const { latitude, longitude } = position.coords;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        setState({
          status: 'unavailable',
          coordinates: null,
          message: 'Koordinat perangkat belum tersedia. Tunggu sebentar lalu perbarui lokasi.',
        });
        return;
      }
      setState({
        status: 'ready',
        coordinates: { latitude, longitude },
        message: 'Lokasi perangkat berhasil dibaca.',
      });
    } catch {
      if (!active.current || sequence !== requestSequence.current) return;
      setState({
        status: 'unavailable',
        coordinates: null,
        message: 'Lokasi belum dapat dibaca. Periksa GPS dan jaringan, lalu coba lagi.',
      });
    }
  }, []);

  useEffect(() => {
    active.current = true;
    queueMicrotask(() => {
      if (active.current) void refresh();
    });
    const networkSubscription = Network.addNetworkStateListener((network) => {
      if (!active.current) return;
      if (network.isConnected === false || network.isInternetReachable === false) {
        requestSequence.current++;
        setState({
          status: 'network-off',
          coordinates: null,
          message: 'Koneksi jaringan terganggu. Aktifkan Wi-Fi atau data seluler, lalu coba lagi.',
        });
      }
    });
    return () => {
      active.current = false;
      networkSubscription.remove();
    };
  }, [refresh]);

  return { state, refresh };
}
