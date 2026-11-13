import AsyncStorage from '@react-native-async-storage/async-storage';
import { connectAuthEmulator, getAuth, initializeAuth, type Auth } from 'firebase/auth';
// Firebase's shared browser declarations omit this React Native runtime export.
// @ts-expect-error Metro resolves the react-native entry which exports this function.
import { getReactNativePersistence } from 'firebase/auth';
import { emulatorHost, getFirebaseApp, useEmulators } from './app';

let instance: Auth | undefined;
export function getFirebaseAuth() {
  if (!instance) {
    const app = getFirebaseApp();
    try {
      instance = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
    } catch (error) {
      if ((error as { code?: string }).code !== 'auth/already-initialized') throw error;
      instance = getAuth(app);
    }
    if (useEmulators)
      connectAuthEmulator(instance, `http://${emulatorHost}:9099`, { disableWarnings: true });
  }
  return instance;
}
