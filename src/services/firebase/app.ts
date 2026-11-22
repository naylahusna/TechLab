import { getApp, getApps, initializeApp } from 'firebase/app';
import Constants from 'expo-constants';
import { resolveDevelopmentHost, resolveLocalServiceUrl } from './development-host';

const manifestFirebase = (Constants.expoConfig?.extra as {
  firebase?: {
    apiKey?: string;
    authDomain?: string;
    projectId?: string;
    appId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
  };
} | undefined)?.firebase;

// Firebase Web client settings are public app configuration, not Admin credentials.
// Keep defaults for this fixed TechLab project so release/dev-client bundles do not
// fail if Expo omits public env values from the runtime manifest.
const firebaseClientDefaults = {
  apiKey: 'AIzaSyA_Ff0KbF4UsuNTdd3dIymfZ2p38L250Zo',
  authDomain: 'techlab-naylahusna-2026.firebaseapp.com',
  projectId: 'techlab-naylahusna-2026',
  appId: '1:1005021249046:web:86496141595dbe4cc73f37',
  storageBucket: 'techlab-naylahusna-2026.firebasestorage.app',
  messagingSenderId: '1005021249046',
};

// Explicit property access is required for Expo's public environment substitution.
const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || manifestFirebase?.apiKey || firebaseClientDefaults.apiKey,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || manifestFirebase?.authDomain || firebaseClientDefaults.authDomain,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || manifestFirebase?.projectId || firebaseClientDefaults.projectId,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || manifestFirebase?.appId || firebaseClientDefaults.appId,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || manifestFirebase?.storageBucket || firebaseClientDefaults.storageBucket,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || manifestFirebase?.messagingSenderId || firebaseClientDefaults.messagingSenderId,
};

export function getFirebaseApp() {
  if (!config.apiKey || !config.projectId || !config.appId) {
    const missing = [
      !config.apiKey && 'API_KEY',
      !config.projectId && 'PROJECT_ID',
      !config.appId && 'APP_ID',
    ].filter(Boolean).join(', ');
    throw new Error(
      `Konfigurasi Firebase belum lengkap${missing ? ` (${missing})` : ''}. Isi EXPO_PUBLIC_FIREBASE_* lalu build ulang aplikasi.`,
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
