import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sessionOpened, scheduleChanged, sessionCancelled, permissionDecided } from './events.mjs';
import { sendPush } from './delivery.mjs';
const klass = { courseName: 'PPK', className: 'A', studentIds: ['p1', 'p2'], assistantIds: ['a1'] };
test('permission approval/rejection targets the owner and includes human decision, never AI updates', () => {
  const pending = { status: 'pending', userId: 'p1', className: 'A', sessionTitle: 'UI' };
  const approved = permissionDecided(pending, { ...pending, status: 'approved' }, 'permission1');
  assert.deepEqual(approved.recipients, ['p1']);
  assert.match(approved.body, /disetujui/);
  assert.equal(approved.path, '/izin/permission1');
  const rejected = permissionDecided(
    pending,
    { ...pending, status: 'rejected', decisionReason: 'Dokumen belum lengkap' },
    'permission1',
  );
  assert.match(rejected.body, /ditolak.*Dokumen belum lengkap/);
  assert.equal(
    permissionDecided(pending, { ...pending, aiStatus: 'completed' }, 'permission1'),
    null,
  );
  assert.equal(
    permissionDecided(
      { ...pending, status: 'approved' },
      { ...pending, status: 'approved' },
      'permission1',
    ),
    null,
  );
});
test('schedule notifications include only affected class members and meaningful changes', () => {
  const before = {
    classId: 'a',
    title: 'UI',
    location: 'Lab A',
    startAt: new Date('2026-11-23T01:00:00Z'),
    endAt: new Date('2026-11-23T03:00:00Z'),
  };
  assert.equal(scheduleChanged(before, { ...before, updatedAt: new Date() }, klass, 's1'), null);
  const event = scheduleChanged(
    before,
    { ...before, title: 'Firebase', location: 'Lab B', startAt: new Date('2026-11-24T01:00:00Z') },
    klass,
    's1',
  );
  assert.deepEqual(event.recipients, ['p1', 'p2', 'a1']);
  assert.match(event.body, /Firebase.*Judul.*Waktu.*Lab B/);
  assert.match(
    scheduleChanged(before, { ...before, archivedAt: new Date() }, klass, 's1').body,
    /diarsipkan/,
  );
  const cancelled = sessionCancelled(
    { status: 'scheduled' },
    { status: 'cancelled', classId: 'a' },
    klass,
    before,
    's1',
  );
  assert.equal(cancelled.type, 'schedule-cancelled');
  assert.equal(
    sessionCancelled({ status: 'cancelled' }, { status: 'cancelled' }, klass, before, 's1'),
    null,
  );
});
test('opening targets only class/session intersection and ignores unrelated updates', () => {
  const after = { status: 'open', studentIds: ['p1', 'outsider'], classId: 'a' };
  const event = sessionOpened(
    { status: 'scheduled' },
    after,
    klass,
    { title: 'UI', location: 'Lab A' },
    's1',
  );
  assert.deepEqual(event.recipients, ['p1']);
  assert.match(event.body, /PPK.*A.*UI.*Lab A/);
  assert.equal(event.path, '/sesi/s1');
  assert.equal(sessionOpened(after, after, klass, {}, 's1'), null);
  assert.equal(sessionOpened(null, after, klass, {}, 's1'), null);
});
test('push request has channel and ownership; failure is explicit', async () => {
  await sendPush(
    { uid: 'p1', token: 'ExpoPushToken[abc]', path: '/sesi/s1', title: 'Open', body: 'Lab A' },
    async (url, init) => {
      const payload = JSON.parse(init.body);
      assert.equal(payload.data.ownerId, 'p1');
      assert.equal(payload.channelId, 'practicum');
      return { ok: true, json: async () => ({ data: { status: 'ok', id: 'ticket1' } }) };
    },
  );
  await assert.rejects(
    sendPush({}, async () => ({ ok: false })),
    /push-unavailable/,
  );
});
