import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFirebaseFirestore } from '../../services/firebase/firestore';
import { registerPush } from './registration';
import type { PushState } from './registration';
export type { PushState } from './registration';

let epoch = 0;
let pending = Promise.resolve();
export function stopPushRegistration() {
  epoch += 1;
}

export async function clearDevicePush(uid: string) {
  stopPushRegistration();
  let timer: ReturnType<typeof setTimeout> | undefined;
  // Never sign out before cleanup is acknowledged; report an actionable error instead.
  try {
    await Promise.race([
      cleanupDevicePush(uid),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('timeout')), 12000);
      }),
    ]);
  } catch {
    throw new Error(
      'Token notifikasi belum dapat dinonaktifkan. Periksa koneksi lalu coba keluar kembali.',
    );
  } finally {
    clearTimeout(timer);
  }
}
async function cleanupDevicePush(uid: string) {
  await pending;
  const token = await AsyncStorage.getItem(`push:${uid}`);
  if (token) {
    await deleteDoc(doc(getFirebaseFirestore(), 'userPushTokens', token));
    await AsyncStorage.removeItem(`push:${uid}`);
  }
}

export function registerDevicePush(uid: string, notify: (state: PushState) => void) {
  const generation = ++epoch;
  notify('loading');
  pending = pending
    .catch(() => {})
    .then(async () => {
      try {
        const { Platform } = await import('react-native');
        if (Platform.OS === 'web' || Constants.appOwnership === 'expo') {
          if (generation === epoch) notify('unsupported');
          return;
        }
        const n = await import('expo-notifications');
        n.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });
        const state = await registerPush({
          supported: true,
          active: () => generation === epoch,
          prepare: async () => {
            if (Platform.OS === 'android')
              await n.setNotificationChannelAsync('practicum', {
                name: 'Kegiatan praktikum',
                importance: n.AndroidImportance.HIGH,
              });
          },
          permission: n.getPermissionsAsync,
          request: n.requestPermissionsAsync,
          token: async () => {
            const projectId = Constants.expoConfig?.extra?.eas?.projectId;
            if (!projectId) throw new Error('Missing project');
            return (await n.getExpoPushTokenAsync({ projectId })).data;
          },
          revoke: async () => {
            const previous = await AsyncStorage.getItem(`push:${uid}`);
            if (previous) await deleteDoc(doc(getFirebaseFirestore(), 'userPushTokens', previous));
            await AsyncStorage.removeItem(`push:${uid}`);
          },
          save: async (token) => {
            const old = await AsyncStorage.getItem(`push:${uid}`);
            if (old && old !== token)
              await deleteDoc(doc(getFirebaseFirestore(), 'userPushTokens', old));
            await AsyncStorage.setItem(`push:${uid}`, token);
            if (generation !== epoch) return;
            await setDoc(doc(getFirebaseFirestore(), 'userPushTokens', token), {
              uid,
              token,
              platform: Platform.OS,
              updatedAt: serverTimestamp(),
            });
          },
        });
        if (generation === epoch) notify(state);
      } catch {
        if (generation === epoch) notify('error');
      }
    });
  return pending;
}
