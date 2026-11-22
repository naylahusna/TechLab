import test from 'node:test';
import assert from 'node:assert/strict';
import { createAttendanceQrHandlers } from './attendance-qr.mjs';

const stamp = (millis) => ({ toMillis: () => millis, toDate: () => new Date(millis) });
class MemoryDb {
  data = new Map();
  doc(path) { return { path, get: async () => this.snap(path), set: async (value) => this.data.set(path, value), update: async (value) => this.data.set(path, { ...this.data.get(path), ...value }) }; }
  snap(path) { const data = this.data.get(path); return { exists: !!data, data: () => data }; }
  collection(name) { return { where: (_field, _op, value) => ({ limit: () => ({ get: async () => { const found = [...this.data.entries()].find(([path, row]) => path.startsWith(`${name}/`) && row.tokenHash === value); return { empty: !found, docs: found ? [{ ref: this.doc(found[0]), data: () => found[1] }] : [] }; } }) }) }; }
  async runTransaction(callback) { return callback({ get: async (ref) => this.snap(ref.path), create: (ref, value) => { if (this.data.has(ref.path)) throw new Error('already exists'); this.data.set(ref.path, value); } }); }
}

async function setup({ enrolled = true, expired = false, already = false } = {}) {
  const db = new MemoryDb();
  const now = Date.now();
  db.data.set('users/asst', { role: 'asisten' });
  db.data.set('users/student', { role: 'praktikan', name: 'Praktikan Uji', number: '123' });
  db.data.set('sessions/s1', { classId: 'c1', status: 'open', startAt: stamp(now - 60_000), endAt: stamp(expired ? now - 1 : now + 600_000) });
  db.data.set('classes/c1', { assistantIds: ['asst'] });
  if (enrolled) db.data.set('participants/c1_student', { leftAt: null });
  if (already) db.data.set('attendances/s1_student', { recordedAt: stamp(now - 30_000) });
  const handlers = createAttendanceQrHandlers(db);
  const { token } = await handlers.create({ auth: { uid: 'asst' }, data: { sessionId: 's1' } });
  return { db, handlers, token };
}

test('QR attendance records an enrolled practitioner once', async () => {
  const { handlers, token, db } = await setup();
  const result = await handlers.attend({ auth: { uid: 'student' }, data: { token } });
  assert.equal(result.alreadyRecorded, false);
  assert.equal(db.data.get('attendances/s1_student').status, 'present');
});

test('invalid QR token is rejected', async () => {
  const { handlers } = await setup();
  await assert.rejects(handlers.attend({ auth: { uid: 'student' }, data: { token: 'x'.repeat(40) } }), { code: 'not-found' });
});

test('expired session is rejected', async () => {
  const { handlers, token } = await setup({ expired: true });
  await assert.rejects(handlers.attend({ auth: { uid: 'student' }, data: { token } }), { code: 'deadline-exceeded' });
});

test('disabled QR cannot be used', async () => {
  const { handlers, token } = await setup();
  await handlers.disable({ auth: { uid: 'asst' }, data: { sessionId: 's1' } });
  await assert.rejects(handlers.attend({ auth: { uid: 'student' }, data: { token } }), { code: 'failed-precondition' });
});

test('unregistered practitioner is rejected', async () => {
  const { handlers, token } = await setup({ enrolled: false });
  await assert.rejects(handlers.attend({ auth: { uid: 'student' }, data: { token } }), { code: 'permission-denied' });
});

test('duplicate attendance returns the original time without adding a record', async () => {
  const { handlers, token, db } = await setup({ already: true });
  const record = db.data.get('attendances/s1_student');
  const result = await handlers.attend({ auth: { uid: 'student' }, data: { token } });
  assert.equal(result.alreadyRecorded, true);
  assert.equal(db.data.get('attendances/s1_student'), record);
});
