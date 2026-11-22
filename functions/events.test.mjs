import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sessionOpened } from './events.mjs';
import { sendPush } from './delivery.mjs';
const klass = { courseName: 'PPK', className: 'A', studentIds: ['p1', 'p2'], assistantIds: ['a1'] };
test('opening targets only class/session intersection and ignores unrelated updates', () => {
  const after = { status: 'open', studentIds: ['p1', 'outsider'], classId: 'a' };
  const event = sessionOpened({ status: 'scheduled' }, after, klass, { title: 'UI', location: 'Lab A' }, 's1');
  assert.deepEqual(event.recipients, ['p1']);
  assert.match(event.body, /PPK.*A.*UI.*Lab A/);
  assert.equal(event.path, '/sesi/s1');
  assert.equal(sessionOpened(after, after, klass, {}, 's1'), null);
  assert.equal(sessionOpened(null, after, klass, {}, 's1'), null);
});
test('push request has channel and ownership; failure is explicit', async () => {
  await sendPush({ uid: 'p1', token: 'ExpoPushToken[abc]', path: '/sesi/s1', title: 'Open', body: 'Lab A' }, async (url, init) => {
    const payload = JSON.parse(init.body);
    assert.equal(payload.data.ownerId, 'p1'); assert.equal(payload.channelId, 'practicum');
    return { ok: true, json: async () => ({ data: { status: 'ok', id: 'ticket1' } }) };
  });
  await assert.rejects(sendPush({}, async () => ({ ok: false })), /push-unavailable/);
});
