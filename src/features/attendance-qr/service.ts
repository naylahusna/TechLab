import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';
import { getFirebaseApp, emulatorHost, useEmulators } from '../../services/firebase/app';

let emulatorConnected = false;
function functions() {
  const instance = getFunctions(getFirebaseApp(), 'asia-southeast2');
  if (useEmulators && !emulatorConnected) {
    // Firebase Functions emulator uses the same host as Auth and Firestore.
    connectFunctionsEmulator(instance, emulatorHost, 5001);
    emulatorConnected = true;
  }
  return instance;
}

export async function createQr(sessionId: string) {
  const call = httpsCallable<{ sessionId: string }, { token: string; expiresAt: string | null }>(functions(), 'createAttendanceQr');
  return (await call({ sessionId })).data;
}

export async function disableQr(sessionId: string) {
  const call = httpsCallable<{ sessionId: string }, { ok: boolean }>(functions(), 'disableAttendanceQr');
  return (await call({ sessionId })).data;
}

export async function recordQrAttendance(token: string) {
  const call = httpsCallable<{ token: string }, { sessionId: string; attendanceTime: string | null; name?: string; nim?: string; alreadyRecorded: boolean }>(functions(), 'recordQrAttendance');
  return (await call({ token })).data;
}

export function qrPayload(token: string) {
  return `techlab://attendance?token=${encodeURIComponent(token)}`;
}
