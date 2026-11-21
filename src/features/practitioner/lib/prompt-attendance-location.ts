import { Alert, Linking } from 'react-native';

export type AttendanceLocationPromptResult =
  | { status: 'ready'; latitude: number; longitude: number }
  | 'permission-denied'
  | 'services-off'
  | 'location-unavailable'
  | 'network-off'
  | 'native-unavailable';

export async function promptAttendanceLocation(): Promise<AttendanceLocationPromptResult> {
  try {
    const Location = await import('expo-location');
    const Network = await import('expo-network');

    const network = await Network.getNetworkStateAsync();
    if (network.isConnected === false || network.isInternetReachable === false) {
      return 'network-off';
    }

    let permission = await Location.getForegroundPermissionsAsync();
    if (!permission.granted) {
      permission = await Location.requestForegroundPermissionsAsync();
    }
    if (!permission.granted) return 'permission-denied';

    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      try {
        await Location.enableNetworkProviderAsync();
      } catch {
        return 'services-off';
      }

      const enabledAfterPrompt = await Location.hasServicesEnabledAsync();
      if (!enabledAfterPrompt) return 'services-off';
    }

    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        mayShowUserSettingsDialog: true,
        timeInterval: 10_000,
      });
      if (!Number.isFinite(position.coords.latitude) || !Number.isFinite(position.coords.longitude)) {
        return 'location-unavailable';
      }
      return {
        status: 'ready',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch {
      return 'location-unavailable';
    }
  } catch (error) {
    const text = error instanceof Error ? error.message : String(error);
    if (/ExpoLocation|native module/i.test(text)) return 'native-unavailable';
    return 'services-off';
  }
}

export function openLocationSettings() {
  void Linking.openSettings();
}

export function showAttendanceLocationWarning(result: AttendanceLocationPromptResult): boolean {
  if (typeof result === 'object' && result.status === 'ready') return true;

  if (result === 'permission-denied') {
    Alert.alert(
      'Izin lokasi ditolak',
      'Aktifkan izin lokasi aplikasi agar koordinat perangkat dapat dibaca untuk presensi.',
      [
        { text: 'Nanti', style: 'cancel' },
        { text: 'Buka Pengaturan', onPress: openLocationSettings },
      ],
    );
    return false;
  }

  if (result === 'services-off') {
    Alert.alert(
      'GPS belum aktif',
      'Nyalakan layanan lokasi/GPS pada perangkat, lalu coba buka presensi kembali.',
      [
        { text: 'Nanti', style: 'cancel' },
        { text: 'Buka Pengaturan', onPress: openLocationSettings },
      ],
    );
    return false;
  }

  if (result === 'network-off') {
    Alert.alert(
      'Koneksi jaringan terganggu',
      'Aktifkan Wi-Fi atau data seluler, lalu coba buka presensi kembali.',
      [{ text: 'OK' }],
    );
    return false;
  }

  if (result === 'location-unavailable') {
    Alert.alert(
      'Lokasi belum terbaca',
      'Koordinat perangkat belum tersedia. Pastikan lokasi/GPS aktif dan tunggu hingga sinyal lokasi terbaca.',
      [{ text: 'OK' }],
    );
    return false;
  }

  Alert.alert(
    'Fitur lokasi belum tersedia',
    'Aplikasi perlu build baru agar modul lokasi native tersedia. Gunakan Development Build atau build EAS terbaru.',
    [{ text: 'OK' }],
  );
  return false;
}
