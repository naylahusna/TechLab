import { createHash, randomBytes } from 'node:crypto';
import { Router } from 'express';
import QRCode from 'qrcode';

const qrCollection = 'attendanceQrSessions';
const hashToken = (token) => createHash('sha256').update(token).digest('hex');
const millis = (value) => value?.toMillis?.() ?? (value instanceof Date ? value.getTime() : NaN);

class HttpError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}

function requireDocumentId(value, label) {
  if (typeof value !== 'string' || !value.trim() || value.length > 128 || value.includes('/'))
    throw new HttpError(400, 'invalid-argument', `${label} tidak valid.`);
  return value.trim();
}

export function createAttendanceRouter({ db, auth, FieldValue, Timestamp, publicAppUrl = 'techlab://attendance', qrGenerator = QRCode.toDataURL }) {
  const router = Router();

  router.use(async (req, _res, next) => {
    try {
      const match = req.get('authorization')?.match(/^Bearer\s+(.+)$/i);
      if (!match) throw new HttpError(401, 'unauthenticated', 'Silakan login terlebih dahulu.');
      const decoded = await auth.verifyIdToken(match[1]);
      const userSnap = await db.doc(`users/${decoded.uid}`).get();
      if (!userSnap.exists) throw new HttpError(403, 'permission-denied', 'Profil akun tidak ditemukan.');
      req.identity = { ...userSnap.data(), uid: decoded.uid };
      next();
    } catch (error) {
      next(error instanceof HttpError ? error : new HttpError(401, 'unauthenticated', 'Sesi login tidak valid. Silakan login kembali.'));
    }
  });

  function requireRole(req, allowed) {
    if (!allowed.includes(req.identity.role)) throw new HttpError(403, 'permission-denied', 'Akun tidak memiliki hak untuk tindakan ini.');
  }

  async function assistantCanManage(req, classId, tx) {
    requireRole(req, ['asisten', 'admin']);
    const classRef = db.doc(`classes/${classId}`);
    const classSnap = tx ? await tx.get(classRef) : await classRef.get();
    if (!classSnap.exists || (req.identity.role !== 'admin' && !classSnap.data().assistantIds?.includes(req.identity.uid)))
      throw new HttpError(403, 'permission-denied', 'Asisten tidak ditugaskan pada kelas ini.');
    return classSnap;
  }

  async function locateToken(token) {
    if (typeof token !== 'string' || token.length < 32 || token.length > 200)
      throw new HttpError(400, 'invalid-argument', 'QR Code tidak valid.');
    const found = await db.collection(qrCollection).where('tokenHash', '==', hashToken(token)).limit(1).get();
    if (found.empty) throw new HttpError(404, 'invalid-token', 'QR Code tidak valid.');
    return found.docs[0].ref;
  }

  async function validateLiveQr(qr, session) {
    const now = Date.now();
    if (!qr || qr.status !== 'active') throw new HttpError(410, 'qr-disabled', 'QR Code telah dinonaktifkan.');
    if (session.status !== 'open' || now < millis(session.startAt) || now > millis(session.endAt) || now > millis(qr.expiresAt))
      throw new HttpError(410, 'session-expired', 'Sesi presensi sudah berakhir atau belum aktif.');
  }

  router.post('/qr', async (req, res, next) => {
    try {
      const sessionId = requireDocumentId(req.body?.sessionId, 'Sesi');
      const token = randomBytes(32).toString('base64url');
      const sessionRef = db.doc(`sessions/${sessionId}`);
      const qrRef = db.doc(`${qrCollection}/${sessionId}`);
      const appBase = publicAppUrl.replace(/\?token=.*$/i, '').replace(/\/$/, '');
      const qrDataUrl = await qrGenerator(`${appBase}?token=${encodeURIComponent(token)}`, { errorCorrectionLevel: 'H', margin: 2, width: 420 });
      const now = Date.now();
      let expiresAt;
      await db.runTransaction(async (tx) => {
        const sessionSnap = await tx.get(sessionRef);
        if (!sessionSnap.exists) throw new HttpError(404, 'not-found', 'Sesi praktikum tidak ditemukan.');
        const session = sessionSnap.data();
        await assistantCanManage(req, session.classId, tx);
        if (session.status !== 'open' || now < millis(session.startAt) || now > millis(session.endAt))
          throw new HttpError(409, 'session-not-open', 'Sesi harus sedang dibuka dan masih dalam waktu presensi.');
        expiresAt = Timestamp.fromMillis(millis(session.endAt));
        tx.set(qrRef, { sessionId, classId: session.classId, assistantId: req.identity.uid, tokenHash: hashToken(token), status: 'active', expiresAt, updatedAt: FieldValue.serverTimestamp() });
      });
      res.json({ qrDataUrl, expiresAt: expiresAt.toDate().toISOString(), status: 'active' });
    } catch (error) { next(error); }
  });

  router.post('/verify', async (req, res, next) => {
    try {
      requireRole(req, ['praktikan']);
      const qrRef = await locateToken(req.body?.token);
      const qrSnap = await qrRef.get();
      const qr = qrSnap.data();
      const sessionSnap = await db.doc(`sessions/${qr.sessionId}`).get();
      if (!sessionSnap.exists) throw new HttpError(404, 'not-found', 'Sesi praktikum tidak ditemukan.');
      const session = sessionSnap.data();
      await validateLiveQr(qr, session);
      const participant = await db.doc(`participants/${qr.classId}_${req.identity.uid}`).get();
      if (!participant.exists || participant.data().leftAt) throw new HttpError(403, 'not-enrolled', 'Praktikan tidak terdaftar pada kelas ini.');
      const [classSnap, scheduleSnap, attendanceSnap] = await Promise.all([
        db.doc(`classes/${qr.classId}`).get(),
        db.doc(`schedules/${session.scheduleId}`).get(),
        db.doc(`attendances/${qr.sessionId}_${req.identity.uid}`).get(),
      ]);
      res.json({ valid: true, alreadyRecorded: attendanceSnap.exists, attendanceTime: attendanceSnap.exists ? attendanceSnap.data().recordedAt?.toDate?.()?.toISOString?.() ?? null : null, session: { id: qr.sessionId, practicalSubject: classSnap.data()?.courseName ?? '', className: classSnap.data()?.className ?? '', laboratory: scheduleSnap.data()?.location ?? '', startAt: session.startAt.toDate().toISOString(), endAt: session.endAt.toDate().toISOString() } });
    } catch (error) { next(error); }
  });

  router.post('/submit', async (req, res, next) => {
    try {
      requireRole(req, ['praktikan']);
      const qrRef = await locateToken(req.body?.token);
      const qrSnap = await qrRef.get();
      const qr = qrSnap.data();
      const sessionRef = db.doc(`sessions/${qr.sessionId}`);
      const participantRef = db.doc(`participants/${qr.classId}_${req.identity.uid}`);
      const attendanceRef = db.doc(`attendances/${qr.sessionId}_${req.identity.uid}`);
      const permissionRef = db.doc(`permissions/${qr.sessionId}_${req.identity.uid}`);
      let result;
      await db.runTransaction(async (tx) => {
        const [currentQrSnap, sessionSnap, participantSnap, attendanceSnap, permissionSnap] = await Promise.all([
          tx.get(qrRef), tx.get(sessionRef), tx.get(participantRef), tx.get(attendanceRef), tx.get(permissionRef),
        ]);
        if (!sessionSnap.exists) throw new HttpError(404, 'not-found', 'Sesi praktikum tidak ditemukan.');
        const session = sessionSnap.data();
        const currentQr = currentQrSnap.data();
        await validateLiveQr(currentQr, session);
        if (!participantSnap.exists || participantSnap.data().leftAt) throw new HttpError(403, 'not-enrolled', 'Praktikan tidak terdaftar pada kelas ini.');
        if (attendanceSnap.exists) {
          result = { alreadyRecorded: true, attendanceTime: attendanceSnap.data().recordedAt?.toDate?.()?.toISOString?.() ?? null };
          return;
        }
        if (permissionSnap.exists && ['pending', 'approved'].includes(permissionSnap.data().status))
          throw new HttpError(409, 'permission-pending', 'Presensi tidak tersedia karena pengajuan izin sedang menunggu atau disetujui.');
        const now = Timestamp.now();
        tx.create(attendanceRef, { sessionId: qr.sessionId, classId: qr.classId, userId: req.identity.uid, status: 'present', recordedAt: now, latitude: null, longitude: null, accuracyMeters: null, distanceMeters: null, allowedRadiusMeters: null, locationValidated: false, labName: null });
        result = { alreadyRecorded: false, attendanceTime: now.toDate().toISOString(), name: req.identity.name ?? '', nim: req.identity.number ?? '' };
      });
      res.json({ ...result, sessionId: qr.sessionId });
    } catch (error) { next(error); }
  });

  router.post('/disable', async (req, res, next) => {
    try {
      requireRole(req, ['asisten', 'admin']);
      const sessionId = requireDocumentId(req.body?.sessionId, 'Sesi');
      const qrRef = db.doc(`${qrCollection}/${sessionId}`);
      await db.runTransaction(async (tx) => {
        const qrSnap = await tx.get(qrRef);
        if (!qrSnap.exists) throw new HttpError(404, 'not-found', 'QR sesi tidak ditemukan.');
        await assistantCanManage(req, qrSnap.data().classId, tx);
        tx.update(qrRef, { status: 'disabled', updatedAt: FieldValue.serverTimestamp() });
      });
      res.json({ ok: true });
    } catch (error) { next(error); }
  });

  router.post('/close', async (req, res, next) => {
    try {
      const sessionId = requireDocumentId(req.body?.sessionId, 'Sesi');
      const sessionRef = db.doc(`sessions/${sessionId}`);
      const qrRef = db.doc(`${qrCollection}/${sessionId}`);
      await db.runTransaction(async (tx) => {
        const sessionSnap = await tx.get(sessionRef);
        if (!sessionSnap.exists) throw new HttpError(404, 'not-found', 'Sesi praktikum tidak ditemukan.');
        const session = sessionSnap.data();
        await assistantCanManage(req, session.classId, tx);
        if (session.status !== 'open') throw new HttpError(409, 'invalid-transition', 'Sesi hanya dapat ditutup saat sedang dibuka.');
        const qrSnap = await tx.get(qrRef);
        const now = FieldValue.serverTimestamp();
        tx.update(sessionRef, { status: 'closed', closedAt: now, closedBy: req.identity.uid, updatedAt: now });
        if (qrSnap.exists) tx.update(qrRef, { status: 'disabled', updatedAt: now });
      });
      res.json({ ok: true });
    } catch (error) { next(error); }
  });

  return router;
}

export function attendanceErrorHandler(error, _req, res, _next) {
  const status = Number.isInteger(error?.status) ? error.status : 500;
  if (status >= 500) console.error('Attendance API request failed:', error?.message ?? 'unknown error');
  res.status(status).json({ code: error?.code ?? 'internal', message: status >= 500 ? 'Terjadi kesalahan pada server presensi.' : error.message });
}
