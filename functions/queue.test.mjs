import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enqueue, deliver, checkReceipts } from './delivery.mjs';

function database() {
  const records = new Map([['users/p1', { role: 'praktikan' }]]);
  const db = {
    doc(path) {
      return {
        path,
        get: async () => ({ exists: records.has(path), data: () => records.get(path) }),
        update: async (patch) => records.set(path, { ...records.get(path), ...patch }),
        delete: async () => records.delete(path),
      };
    },
    collection() {
      return { where: () => ({ get: async () => ({ empty: true, docs: [] }) }) };
    },
    async runTransaction(run) {
      return run({
        get: (ref) => ref.get(),
        create: (ref, data) => {
          assert.ok(!records.has(ref.path));
          records.set(ref.path, data);
        },
        update: (ref, data) => ref.update(data),
      });
    },
  };
  return { db, records };
}
test('event replay creates one private inbox record without a device; source session never mutated', async () => {
  const { db, records } = database();
  const event = {
    recipients: ['p1'],
    type: 'session-opened',
    title: 'Sesi dibuka',
    body: 'Lab A',
    path: '/sesi/a',
  };
  await enqueue(db, 'event1', event);
  await enqueue(db, 'event1', event);
  const inbox = [...records.entries()].filter(([path]) => path.includes('/notifications/'));
  assert.equal(inbox.length, 1);
  assert.equal(inbox[0][1].delivery, 'no-device');
  assert.equal(
    [...records.keys()].some((path) => path.startsWith('sessions/')),
    false,
  );
});
test('logout token removal prevents a queued push from being sent', async () => {
  const { db, records } = database();
  records.set('notificationDeliveries/a', {
    state: 'queued',
    uid: 'p1',
    token: 'old',
    inboxPath: 'users/p1/notifications/a',
  });
  records.set('users/p1/notifications/a', {});
  await deliver(db, db.doc('notificationDeliveries/a'));
  assert.equal(records.get('notificationDeliveries/a').state, 'inactive');
});
test('network failure marks delivery failed and preserves source transaction and inbox', async () => {
  const { db, records } = database();
  records.set('userPushTokens/token', { uid: 'p1' });
  records.set('sessions/a', { status: 'open' });
  records.set('notificationDeliveries/a', {
    state: 'queued',
    uid: 'p1',
    token: 'token',
    inboxPath: 'users/p1/notifications/a',
  });
  records.set('users/p1/notifications/a', { body: 'Sesi dibuka' });
  await deliver(db, db.doc('notificationDeliveries/a'), async () => {
    throw new Error('network');
  });
  assert.equal(records.get('notificationDeliveries/a').state, 'failed');
  assert.equal(records.get('users/p1/notifications/a').delivery, 'failed');
  assert.equal(records.get('sessions/a').status, 'open');
});
test('accepted ticket is not called delivered; receipt rejection cleans up stale token', async () => {
  const { db, records } = database();
  records.set('userPushTokens/token', { uid: 'p1' });
  records.set('notificationDeliveries/a', {
    state: 'queued',
    uid: 'p1',
    token: 'token',
    inboxPath: 'users/p1/notifications/a',
  });
  records.set('users/p1/notifications/a', {});
  await deliver(db, db.doc('notificationDeliveries/a'), async () => ({
    status: 'ok',
    id: 'receipt1',
  }));
  assert.equal(records.get('notificationDeliveries/a').state, 'accepted');
  assert.equal(records.get('users/p1/notifications/a').delivery, 'accepted');
  records.get('notificationDeliveries/a').updatedAt = { toMillis: () => Date.now() - 20 * 60000 };
  db.collection = () => ({
    where: () => ({
      limit: () => ({
        get: async () => ({
          docs: [
            {
              ref: db.doc('notificationDeliveries/a'),
              data: () => records.get('notificationDeliveries/a'),
            },
          ],
        }),
      }),
    }),
  });
  const original = db.runTransaction;
  db.runTransaction = async (run) =>
    original((tx) => run({ ...tx, delete: (ref) => ref.delete() }));
  await checkReceipts(db, async () => ({
    ok: true,
    json: async () => ({
      data: { receipt1: { status: 'error', details: { error: 'DeviceNotRegistered' } } },
    }),
  }));
  assert.equal(records.has('userPushTokens/token'), false);
  assert.equal(records.get('notificationDeliveries/a').state, 'failed');
});
