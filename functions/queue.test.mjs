import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enqueue, deliver } from './delivery.mjs';

function database() {
  const records = new Map([['users/p1', { role: 'praktikan' }]]);
  const db = {
    doc(path) { return { path, get: async () => ({ exists: records.has(path), data: () => records.get(path) }),
      update: async (patch) => records.set(path, { ...records.get(path), ...patch }),
      delete: async () => records.delete(path) }; },
    collection() { return { where: () => ({ get: async () => ({ empty: true, docs: [] }) }) }; },
    async runTransaction(run) { return run({ get: (ref) => ref.get(),
      create: (ref, data) => { assert.ok(!records.has(ref.path)); records.set(ref.path, data); },
      update: (ref, data) => ref.update(data) }); },
  };
  return { db, records };
}
test('event replay creates one private inbox record without a device; source session never mutated', async () => {
  const { db, records } = database();
  const event = { recipients: ['p1'], type: 'session-opened', title: 'Sesi dibuka', body: 'Lab A', path: '/sesi/a' };
  await enqueue(db, 'event1', event); await enqueue(db, 'event1', event);
  const inbox = [...records.entries()].filter(([path]) => path.includes('/notifications/'));
  assert.equal(inbox.length, 1); assert.equal(inbox[0][1].delivery, 'no-device');
  assert.equal([...records.keys()].some((path) => path.startsWith('sessions/')), false);
});
test('logout token removal prevents a queued push from being sent', async () => {
  const { db, records } = database();
  records.set('notificationDeliveries/a', { state: 'queued', uid: 'p1', token: 'old', inboxPath: 'users/p1/notifications/a' });
  records.set('users/p1/notifications/a', {});
  await deliver(db, db.doc('notificationDeliveries/a'));
  assert.equal(records.get('notificationDeliveries/a').state, 'inactive');
});
