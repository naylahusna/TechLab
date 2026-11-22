import { useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { registerDevicePush, stopPushRegistration } from './device';

export function NotificationRegistration() {
  const { account } = useAuth();
  const uid = account?.uid;
  useEffect(() => {
    if (!uid) return;
    void registerDevicePush(uid, () => {});
    return stopPushRegistration;
  }, [uid]);
  return null;
}
