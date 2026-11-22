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
    android: {
      ...config.android,
      ...(existsSync(googleServicesFile) ? { googleServicesFile } : {}),
    },
  };
};
