import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';
import { emulatorHost, getFirebaseApp, useEmulators } from './app';

let instance: Firestore | undefined;
export function getFirebaseFirestore() {
  if (!instance) {
    instance = getFirestore(getFirebaseApp());
    if (useEmulators) connectFirestoreEmulator(instance, emulatorHost, 8080);
  }
  return instance;
}
