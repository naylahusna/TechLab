import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { getFirebaseAuth } from '../../services/firebase/auth';
import { getFirebaseFirestore } from '../../services/firebase/firestore';

const qrCollection = 'attendanceQrSessions';
const codeCollection = 'attendanceQrCodes';
const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function extractAttendanceCode(rawInput: string): string {
  const trimmed = rawInput.trim();
  const match = trimmed.match(/TL-[A-Za-z0-9]+-[A-Za-z0-9]+/i);
  return match ? match[0].toUpperCase() : trimmed.toUpperCase();
}

export function createAttendanceCode() {
  let suffix = '';
  for (let i = 0; i < 8; i += 1) suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `TL-${Date.now().toString(36).toUpperCase()}-${suffix}`;
}

export async function createQr(sessionId: string, classId: string, attendanceCode: string) {
  const uid = getFirebaseAuth().currentUser?.uid;
  if (!uid) throw new Error('Silakan login kembali.');
  const db = getFirebaseFirestore();
  const sessionRef = doc(db, 'sessions', sessionId);
  const qrRef = doc(db, qrCollection, sessionId);
  const codeRef = doc(db, codeCollection, attendanceCode);

  const expiresAt = await runTransaction(db, async (transaction) => {
    const sessionSnap = await transaction.get(sessionRef);
    const existingQrSnap = await transaction.get(qrRef);
    if (!sessionSnap.exists()) throw new Error('Sesi praktikum tidak ditemukan.');
    const session = sessionSnap.data();
    if (session.classId !== classId) throw new Error('Kelas sesi tidak cocok.');
    if (session.status !== 'open') throw new Error('Buka sesi praktikum sebelum membuat QR.');
    if (session.endAt.toMillis() <= Date.now()) throw new Error('Waktu presensi sesi sudah berakhir.');
    if (existingQrSnap.exists()) {
      const oldCode = existingQrSnap.data().attendanceCode as string;
      if (oldCode !== attendanceCode) {
        const oldCodeRef = doc(db, codeCollection, oldCode);
        const oldCodeSnap = await transaction.get(oldCodeRef);
        if (oldCodeSnap.exists()) transaction.update(oldCodeRef, { status: 'disabled', updatedAt: serverTimestamp() });
      }
    }
    transaction.set(qrRef, {
      sessionId,
      classId,
      assistantId: uid,
      attendanceCode,
      status: 'active',
      expiresAt: session.endAt,
      updatedAt: serverTimestamp(),
    });
    transaction.set(codeRef, {
      sessionId,
      classId,
      assistantId: uid,
      attendanceCode,
      status: 'active',
      expiresAt: session.endAt,
      updatedAt: serverTimestamp(),
    });
    return session.endAt.toDate().toISOString();
  });
  return { expiresAt };
}

export async function getSavedQr(sessionId: string) {
  const snapshot = await getDoc(doc(getFirebaseFirestore(), qrCollection, sessionId));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  const rawExpiresAt = data.expiresAt;
  const expiresAtIso = typeof rawExpiresAt?.toDate === 'function'
    ? rawExpiresAt.toDate().toISOString()
    : rawExpiresAt instanceof Date
      ? rawExpiresAt.toISOString()
      : typeof rawExpiresAt === 'string'
        ? new Date(rawExpiresAt).toISOString()
        : new Date().toISOString();
  return {
    attendanceCode: data.attendanceCode as string,
    status: data.status as 'active' | 'disabled',
    expiresAt: expiresAtIso,
  };
}

export async function disableQr(sessionId: string) {
  const db = getFirebaseFirestore();
  const qrRef = doc(db, qrCollection, sessionId);
  const snapshot = await getDoc(qrRef);
  if (!snapshot.exists()) return;
  const codeRef = doc(db, codeCollection, snapshot.data().attendanceCode as string);
  await runTransaction(db, async (transaction) => {
    const current = await transaction.get(qrRef);
    if (!current.exists()) return;
    transaction.update(qrRef, { status: 'disabled', updatedAt: serverTimestamp() });
    transaction.update(codeRef, { status: 'disabled', updatedAt: serverTimestamp() });
  });
}

export async function getQrSessionByCode(attendanceCode: string) {
  const normalizedCode = attendanceCode.trim().toUpperCase();
  const snapshot = await getDoc(doc(getFirebaseFirestore(), codeCollection, normalizedCode));
  if (!snapshot.exists()) {
    throw new Error('Kode barcode presensi tidak ditemukan. Minta asisten membuat QR baru dari aplikasi versi terbaru.');
  }
  const data = snapshot.data();
  if (data.attendanceCode !== normalizedCode || data.status !== 'active') {
    throw new Error('Barcode QR presensi sudah dinonaktifkan.');
  }
  const rawExpiresAt = data.expiresAt;
  const expiresAtMs = typeof rawExpiresAt?.toMillis === 'function'
    ? rawExpiresAt.toMillis()
    : rawExpiresAt instanceof Date
      ? rawExpiresAt.getTime()
      : typeof rawExpiresAt === 'string'
        ? Date.parse(rawExpiresAt)
        : 0;
  if (expiresAtMs > 0 && expiresAtMs <= Date.now()) {
    throw new Error('Barcode QR presensi sudah kedaluwarsa.');
  }
  return { sessionId: data.sessionId as string, classId: data.classId as string };
}
