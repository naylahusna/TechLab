import test from 'node:test';
import assert from 'node:assert/strict';
import { createAttendanceApp } from './attendance.mjs';

const stamp = (ms) => ({ toMillis: () => ms, toDate: () => new Date(ms) });
const Timestamp = { fromMillis: stamp, now: () => stamp(Date.now()) };
const FieldValue = { serverTimestamp: () => stamp(Date.now()) };

class MemoryDb {
  values = new Map();
  doc(path) {
    return {
      path,
      get: async () => this.snapshot(path),
      set: async (value) => this.values.set(path, value),
      update: async (value) => this.values.set(path, { ...this.values.get(path), ...value }),
    };
  }
  snapshot(path) {
    const value = this.values.get(path);
    return { exists: this.values.has(path), data: () => value, ref: this.doc(path) };
  }
  collection(name) {
    return { where: (_field, _op, match) => ({ limit: () => ({ get: async () => {
      const record = [...this.values].find(([path, value]) => path.startsWith(`${name}/`) && value.tokenHash === match);
      return { empty: !record, docs: record ? [{ ref: this.doc(record[0]), data: () => record[1] }] : [] };
    } }) }) };
  }
  async runTransaction(callback) {
    const writes = [];
    const tx = {
      get: async (ref) => this.snapshot(ref.path),
      set: (ref, data) => writes.push(() => this.values.set(ref.path, data)),
      update: (ref, data) => writes.push(() => this.values.set(ref.path, { ...this.values.get(ref.path), ...data })),
      create: (ref, data) => writes.push(() => {
        if (this.values.has(ref.path)) throw new Error('Document already exists');
        this.values.set(ref.path, data);
      }),
    };
    const result = await callback(tx);
    for (const write of writes) write();
    return result;
  }
}

async function setup({ enrolled = true, stubQr = true } = {}) {
  const now = Date.now();
  const db = new MemoryDb();
  db.values.set('users/asst', { role: 'asisten', name: 'Asisten', number: 'A1' });
  db.values.set('users/student', { role: 'praktikan', name: 'Praktikan', number: 'S1' });
  db.values.set('users/other', { role: 'asisten', name: 'Asisten Lain', number: 'A2' });
  db.values.set('sessions/s1', { classId: 'c1', scheduleId: 's1', status: 'open', startAt: stamp(now - 60_000), endAt: stamp(now + 600_000) });
  db.values.set('classes/c1', { className: 'A', courseName: 'Fisika', assistantIds: ['asst'], studentIds: ['student'] });
  db.values.set('schedules/s1', { title: 'Sesi 1', location: 'Lab Fisika' });
  if (enrolled) db.values.set('participants/c1_student', { leftAt: null });
  let qrPayload = '';
  const auth = { verifyIdToken: async (token) => {
    if (!['assistant-token', 'student-token', 'other-token'].includes(token)) throw new Error('invalid token');
    return { uid: token === 'assistant-token' ? 'asst' : token === 'other-token' ? 'other' : 'student' };
  } };
  const appOptions = { db, auth, FieldValue, Timestamp, allowedOrigins: ['http://localhost:8081'] };
  if (stubQr) appOptions.qrGenerator = async (payload) => { qrPayload = payload; return 'data:image/png;base64,cXJ0ZXN0'; };
  const app = createAttendanceApp(appOptions);
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = async (path, token, body = {}) => {
    const response = await fetch(`${base}/api/attendance/${path}`, { method: 'POST', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return { status: response.status, body: await response.json() };
  };
  return { db, server, request, getQrPayload: () => qrPayload };
}

async function closeServer(server) { await new Promise((resolve) => server.close(resolve)); }

test('assistant creates a QR image with an expiring random token', async () => {
  const ctx = await setup();
  try {
    const response = await ctx.request('qr', 'assistant-token', { sessionId: 's1' });
    assert.equal(response.status, 200);
    assert.match(response.body.qrDataUrl, /^data:image\/png;base64,/);
    const token = new URL(ctx.getQrPayload()).searchParams.get('token');
    assert.ok(token && token.length >= 40);
    assert.equal(ctx.db.values.get('attendanceQrSessions/s1').tokenHash.length, 64);
    assert.equal(ctx.db.values.get('attendanceQrSessions/s1').tokenHash.includes(token), false);
  } finally { await closeServer(ctx.server); }
});

test('real QRCode encoder returns an image data URL', async () => {
  const ctx = await setup({ stubQr: false });
  try {
    const response = await ctx.request('qr', 'assistant-token', { sessionId: 's1' });
    assert.equal(response.status, 200);
    assert.match(response.body.qrDataUrl, /^data:image\/png;base64,/);
    assert.equal(ctx.db.values.has('attendanceQrSessions/s1'), true);
  } finally { await closeServer(ctx.server); }
});

test('valid QR verifies and submits once; repeat scan returns original time', async () => {
  const ctx = await setup();
  try {
    await ctx.request('qr', 'assistant-token', { sessionId: 's1' });
    const token = new URL(ctx.getQrPayload()).searchParams.get('token');
    assert.equal((await ctx.request('verify', 'student-token', { token })).body.valid, true);
    const submitted = await ctx.request('submit', 'student-token', { token });
    assert.equal(submitted.status, 200);
    assert.equal(submitted.body.alreadyRecorded, false);
    const duplicate = await ctx.request('submit', 'student-token', { token });
    assert.equal(duplicate.status, 200);
    assert.equal(duplicate.body.alreadyRecorded, true);
  } finally { await closeServer(ctx.server); }
});

test('invalid and expired tokens are rejected', async () => {
  const ctx = await setup();
  try {
    assert.equal((await ctx.request('verify', 'student-token', { token: 'x'.repeat(48) })).status, 404);
    await ctx.request('qr', 'assistant-token', { sessionId: 's1' });
    const token = new URL(ctx.getQrPayload()).searchParams.get('token');
    ctx.db.values.get('attendanceQrSessions/s1').expiresAt = stamp(Date.now() - 1);
    assert.equal((await ctx.request('verify', 'student-token', { token })).status, 410);
  } finally { await closeServer(ctx.server); }
});

test('unregistered and unauthenticated practitioners cannot verify QR', async () => {
  const ctx = await setup({ enrolled: false });
  try {
    await ctx.request('qr', 'assistant-token', { sessionId: 's1' });
    const token = new URL(ctx.getQrPayload()).searchParams.get('token');
    assert.equal((await ctx.request('verify', 'student-token', { token })).body.code, 'not-enrolled');
    assert.equal((await ctx.request('verify', null, { token })).status, 401);
  } finally { await closeServer(ctx.server); }
});

test('Firebase Admin profile read failure is reported as backend unavailable', async () => {
  const app = createAttendanceApp({
    db: { doc: () => ({ get: async () => { throw new Error('credentials missing'); } }) },
    auth: { verifyIdToken: async () => ({ uid: 'student' }) },
    allowedOrigins: ['http://localhost:8081'],
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/attendance/qr`, {
      method: 'POST', headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: 's1' }),
    });
    const result = await response.json();
    assert.equal(response.status, 503);
    assert.equal(result.code, 'firebase-admin-unavailable');
  } finally { await closeServer(server); }
});

test('assistant can disable the QR without closing the session', async () => {
  const ctx = await setup();
  try {
    await ctx.request('qr', 'assistant-token', { sessionId: 's1' });
    const token = new URL(ctx.getQrPayload()).searchParams.get('token');
    assert.equal((await ctx.request('disable', 'assistant-token', { sessionId: 's1' })).status, 200);
    assert.equal(ctx.db.values.get('sessions/s1').status, 'open');
    assert.equal((await ctx.request('verify', 'student-token', { token })).body.code, 'qr-disabled');
  } finally { await closeServer(ctx.server); }
});

test('only assigned assistant can create QR; close disables QR and closes session', async () => {
  const ctx = await setup();
  try {
    assert.equal((await ctx.request('qr', 'other-token', { sessionId: 's1' })).status, 403);
    await ctx.request('qr', 'assistant-token', { sessionId: 's1' });
    const token = new URL(ctx.getQrPayload()).searchParams.get('token');
    assert.equal((await ctx.request('close', 'assistant-token', { sessionId: 's1' })).status, 200);
    assert.equal(ctx.db.values.get('sessions/s1').status, 'closed');
    assert.equal(ctx.db.values.get('attendanceQrSessions/s1').status, 'disabled');
    assert.equal((await ctx.request('verify', 'student-token', { token })).body.code, 'qr-disabled');
  } finally { await closeServer(ctx.server); }
});
