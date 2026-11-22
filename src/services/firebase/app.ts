import { getApp, getApps, initializeApp } from 'firebase/app';
import Constants from 'expo-constants';
import { resolveDevelopmentHost, resolveLocalServiceUrl } from './development-host';

const manifestFirebase = (Constants.expoConfig?.extra as {
  firebase?: {
    apiKey?: string;
    authDomain?: string;
    projectId?: string;
    appId?: string;
    messagingSenderId?: string;
  };
} | undefined)?.firebase;

// Explicit property access is required for Expo's public environment substitution.
const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || manifestFirebase?.apiKey,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || manifestFirebase?.authDomain,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || manifestFirebase?.projectId,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || manifestFirebase?.appId,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || manifestFirebase?.messagingSenderId,
};

export function getFirebaseApp() {
  if (!config.apiKey || !config.projectId || !config.appId) {
    throw new Error(
      'Konfigurasi Firebase belum lengkap. Salin .env.example ke .env dan isi konfigurasi aplikasi.',
    );
  }
  if (config.projectId !== 'techlab-naylahusna-2026') {
    throw new Error('Konfigurasi harus menggunakan proyek Firebase TechLab.');
  }
  return getApps().length ? getApp() : initializeApp(config);
}

export const useEmulators = __DEV__ && process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS === 'true';
const configuredHost = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST || '127.0.0.1';
export const emulatorHost = useEmulators
  ? resolveDevelopmentHost(configuredHost, Constants.expoConfig?.hostUri)
  : configuredHost;

export function developmentServiceUrl(endpoint: string | undefined) {
  return resolveLocalServiceUrl(endpoint, configuredHost, emulatorHost, useEmulators);
}
