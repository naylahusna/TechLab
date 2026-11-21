export type AttendanceLocationPromptResult =
  | 'ready'
  | 'permission-denied'
  | 'services-off'
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

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      mayShowUserSettingsDialog: true,
    });
    if (!Number.isFinite(position.coords.latitude) || !Number.isFinite(position.coords.longitude)) {
      return 'services-off';
    }

    return 'ready';
  } catch (error) {
    const text = error instanceof Error ? error.message : String(error);
    if (/ExpoLocation|native module/i.test(text)) return 'native-unavailable';
    return 'services-off';
  }
}
