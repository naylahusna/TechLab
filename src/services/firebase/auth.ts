import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';
import { emulatorHost, getFirebaseApp, useEmulators } from './app';

let instance: Auth | undefined;
export function getFirebaseAuth() {
  if (!instance) {
    instance = getAuth(getFirebaseApp());
    if (useEmulators)
      connectAuthEmulator(instance, `http://${emulatorHost}:9099`, { disableWarnings: true });
  }
  return instance;
}
