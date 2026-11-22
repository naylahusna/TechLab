import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import Constants from 'expo-constants';
import { useRouter, useRootNavigationState } from 'expo-router';
import { useAuth } from '../auth/AuthProvider';
import { registerDevicePush, stopPushRegistration } from './device';
import { pushStatus } from './status';

export function NotificationRegistration() {
  const { account } = useAuth();
  const uid = account?.uid;
  const router = useRouter();
  const navigation = useRootNavigationState();
  useEffect(() => {
    if (!uid || !navigation?.key) return;
    let active = true;
    const register = () => void registerDevicePush(uid, pushStatus.set);
    register();
    const foreground = AppState.addEventListener('change', (state) => {
      if (state === 'active') register();
    });
    const subscriptions: { remove(): void }[] = [];
    if (Platform.OS !== 'web' && Constants.appOwnership !== 'expo') {
      void import('expo-notifications')
        .then(async (n) => {
          if (!active) return;
          const open = (response: import('expo-notifications').NotificationResponse) => {
            const data = response.notification.request.content.data;
            if (!active || !data || data.ownerId !== uid || typeof data.path !== 'string') return;
            if (!/^\/(sesi|izin)\/[A-Za-z0-9_.-]+$/.test(data.path)) return;
            router.push(data.path as '/izin');
            void n.clearLastNotificationResponseAsync();
          };
          subscriptions.push(n.addNotificationResponseReceivedListener(open));
          subscriptions.push(n.addPushTokenListener(register));
          const previous = await n.getLastNotificationResponseAsync();
          if (previous) open(previous);
        })
        .catch(() => {
          if (active) pushStatus.set('error');
        });
    }
    return () => {
      active = false;
      stopPushRegistration();
      foreground.remove();
      subscriptions.forEach((s) => s.remove());
    };
  }, [uid, router, navigation?.key]);
  return null;
}
