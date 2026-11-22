import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { getFirebaseAuth } from '../../services/firebase/auth';
import { getFirebaseFirestore } from '../../services/firebase/firestore';

const qrCollection = 'attendanceQrSessions';
const codeCollection = 'attendanceQrCodes';
const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

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
  return {
    attendanceCode: data.attendanceCode as string,
    status: data.status as 'active' | 'disabled',
    expiresAt: data.expiresAt.toDate().toISOString() as string,
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
  const snapshot = await getDoc(doc(getFirebaseFirestore(), codeCollection, attendanceCode));
  if (!snapshot.exists()) throw new Error('Kode QR tidak dikenal. Minta asisten membuat QR yang aktif.');
  const data = snapshot.data();
  if (data.attendanceCode !== attendanceCode || data.status !== 'active') throw new Error('QR presensi sudah dinonaktifkan.');
  if (data.expiresAt.toMillis() <= Date.now()) throw new Error('QR presensi sudah kedaluwarsa.');
  return { sessionId: data.sessionId as string };
}
