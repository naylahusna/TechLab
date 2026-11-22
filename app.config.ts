import { existsSync } from 'node:fs';
import type { ExpoConfig, ConfigContext } from 'expo/config';

// Native Firebase client file is supplied locally by the project owner.
// Never include Admin SDK / FCM server credentials here.
export default ({ config }: ConfigContext): ExpoConfig => {
  const googleServicesFile = process.env.GOOGLE_SERVICES_JSON || './google-services.json';
  return {
    ...config,
    name: config.name || 'TechLab',
    slug: config.slug || 'TechLab',
    extra: {
      ...config.extra,
      firebase: {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
        messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      },
    },
    android: {
      ...config.android,
      ...(existsSync(googleServicesFile) ? { googleServicesFile } : {}),
    },
  };
};
