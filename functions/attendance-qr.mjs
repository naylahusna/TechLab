import { createHash, randomBytes } from 'node:crypto';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

const region = 'asia-southeast2';
const hashToken = (token) => createHash('sha256').update(token).digest('hex');

function requireUid(request) {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Silakan login terlebih dahulu.');
  return request.auth.uid;
}

async function profile(db, uid) {
  const snap = await db.doc(`users/${uid}`).get();
  if (!snap.exists || !['asisten', 'admin', 'praktikan'].includes(snap.data().role))
    throw new HttpsError('permission-denied', 'Akun tidak memiliki akses aktif.');
  return snap.data();
}

export function createAttendanceQrHandlers(db) {
  return {
    create: async (request) => {
      const uid = requireUid(request);
      const user = await profile(db, uid);
      if (!['asisten', 'admin'].includes(user.role)) throw new HttpsError('permission-denied', 'Hanya asisten yang dapat membuat QR.');
      const sessionId = request.data?.sessionId;
      if (typeof sessionId !== 'string' || !sessionId || sessionId.includes('/')) throw new HttpsError('invalid-argument', 'Sesi tidak valid.');
      const sessionRef = db.doc(`sessions/${sessionId}`);
      const sessionSnap = await sessionRef.get();
      if (!sessionSnap.exists) throw new HttpsError('not-found', 'Sesi praktikum tidak ditemukan.');
      const session = sessionSnap.data();
      const classSnap = await db.doc(`classes/${session.classId}`).get();
      if (!classSnap.exists || (user.role !== 'admin' && !classSnap.data().assistantIds?.includes(uid))) throw new HttpsError('permission-denied', 'Sesi ini bukan kelas yang Anda asuh.');
      if (session.status !== 'open') throw new HttpsError('failed-precondition', 'Buka sesi praktikum sebelum membuat QR.');
      const token = randomBytes(32).toString('base64url');
      const qrRef = db.doc(`attendanceQrSessions/${sessionId}`);
      await qrRef.set({ sessionId, classId: session.classId, assistantId: uid, tokenHash: hashToken(token), status: 'active', expiresAt: session.endAt, updatedAt: new Date() });
      return { token, expiresAt: session.endAt?.toDate?.()?.toISOString?.() ?? null };
    },
    disable: async (request) => {
      const uid = requireUid(request);
      const user = await profile(db, uid);
      if (!['asisten', 'admin'].includes(user.role)) throw new HttpsError('permission-denied', 'Hanya asisten yang dapat menonaktifkan QR.');
      const sessionId = request.data?.sessionId;
      const ref = db.doc(`attendanceQrSessions/${sessionId}`);
      const snap = await ref.get();
      if (!snap.exists) throw new HttpsError('not-found', 'QR sesi tidak ditemukan.');
      const klass = await db.doc(`classes/${snap.data().classId}`).get();
      if (!klass.exists || (user.role !== 'admin' && !klass.data().assistantIds?.includes(uid))) throw new HttpsError('permission-denied', 'Sesi ini bukan kelas yang Anda asuh.');
      await ref.update({ status: 'disabled', updatedAt: new Date() });
      return { ok: true };
    },
    attend: async (request) => {
      const uid = requireUid(request);
      const user = await profile(db, uid);
      if (user.role !== 'praktikan') throw new HttpsError('permission-denied', 'Presensi QR hanya tersedia untuk akun praktikan.');
      const token = request.data?.token;
      if (typeof token !== 'string' || token.length < 32 || token.length > 200) throw new HttpsError('invalid-argument', 'QR Code tidak valid.');
      const digest = hashToken(token);
      const matches = await db.collection('attendanceQrSessions').where('tokenHash', '==', digest).limit(1).get();
      if (matches.empty) throw new HttpsError('not-found', 'QR Code tidak valid.');
      const qrSnap = matches.docs[0];
      return db.runTransaction(async (tx) => {
        const qr = (await tx.get(qrSnap.ref)).data();
        const sessionRef = db.doc(`sessions/${qr.sessionId}`);
        const sessionSnap = await tx.get(sessionRef);
        if (!sessionSnap.exists || qr.status !== 'active') throw new HttpsError('failed-precondition', 'QR Code telah dinonaktifkan.');
        const session = sessionSnap.data();
        const now = Date.now();
        if (session.status !== 'open' || !session.startAt || !session.endAt || now < session.startAt.toMillis() || now > session.endAt.toMillis() || qr.expiresAt.toMillis() < now) throw new HttpsError('deadline-exceeded', 'Sesi presensi sudah berakhir atau belum aktif.');
        const participantRef = db.doc(`participants/${qr.classId}_${uid}`);
        const [participantSnap, attendanceSnap] = await Promise.all([tx.get(participantRef), tx.get(db.doc(`attendances/${qr.sessionId}_${uid}`))]);
        if (!participantSnap.exists || participantSnap.data().leftAt) throw new HttpsError('permission-denied', 'Praktikan tidak terdaftar pada kelas ini.');
        if (attendanceSnap.exists) return { alreadyRecorded: true, attendanceTime: attendanceSnap.data().recordedAt?.toDate?.()?.toISOString?.() ?? null, sessionId: qr.sessionId };
        const permissionSnap = await tx.get(db.doc(`permissions/${qr.sessionId}_${uid}`));
        if (permissionSnap.exists && ['pending', 'approved'].includes(permissionSnap.data().status)) throw new HttpsError('failed-precondition', 'Presensi tidak tersedia karena pengajuan izin sedang menunggu atau disetujui.');
        tx.create(db.doc(`attendances/${qr.sessionId}_${uid}`), { sessionId: qr.sessionId, classId: qr.classId, userId: uid, status: 'present', recordedAt: new Date(), latitude: null, longitude: null, accuracyMeters: null, distanceMeters: null, allowedRadiusMeters: null, locationValidated: false, labName: null, verificationMethod: 'qr' });
        return { alreadyRecorded: false, sessionId: qr.sessionId, attendanceTime: new Date(now).toISOString(), name: user.name, nim: user.number };
      });
    },
  };
}
