import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFirebaseFirestore } from '../../services/firebase/firestore';

let epoch = 0;
let pending = Promise.resolve();
export type PushState = 'loading' | 'ready' | 'denied' | 'unsupported' | 'error';
export function stopPushRegistration() { epoch += 1; }

export async function clearDevicePush(uid: string) {
  stopPushRegistration();
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
  pending = pending.catch(() => {}).then(async () => {
    try {
      const { Platform } = await import('react-native');
      if (Platform.OS === 'web' || Constants.appOwnership === 'expo') {
        if (generation === epoch) notify('unsupported');
        return;
      }
      const n = await import('expo-notifications');
      n.setNotificationHandler({ handleNotification: async () => ({
        shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false,
      }) });
      if (Platform.OS === 'android') await n.setNotificationChannelAsync('practicum', {
        name: 'Kegiatan praktikum', importance: n.AndroidImportance.HIGH,
      });
      let permission = await n.getPermissionsAsync();
      if (!permission.granted && permission.canAskAgain) permission = await n.requestPermissionsAsync();
      if (!permission.granted) {
        const previous = await AsyncStorage.getItem(`push:${uid}`);
        if (previous) await deleteDoc(doc(getFirebaseFirestore(), 'userPushTokens', previous));
        if (generation === epoch) notify('denied');
        return;
      }
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) throw new Error('Missing project');
      const token = (await n.getExpoPushTokenAsync({ projectId })).data;
      if (generation !== epoch) return;
      // Remember before writing so logout also cleans up an interrupted registration.
      const old = await AsyncStorage.getItem(`push:${uid}`);
      if (old && old !== token) await deleteDoc(doc(getFirebaseFirestore(), 'userPushTokens', old));
      await AsyncStorage.setItem(`push:${uid}`, token);
      if (generation !== epoch) return;
      await setDoc(doc(getFirebaseFirestore(), 'userPushTokens', token), {
        uid, token, platform: Platform.OS, updatedAt: serverTimestamp(),
      });
      if (generation === epoch) notify('ready');
    } catch {
      if (generation === epoch) notify('error');
    }
  });
  return pending;
}
