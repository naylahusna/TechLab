import { getApp, getApps, initializeApp } from 'firebase/app';

// Explicit property access is required for Expo's public environment substitution.
const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
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
export const emulatorHost = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST || '127.0.0.1';
