import assert from 'node:assert/strict';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
if (process.env.GCLOUD_PROJECT !== 'demo-techlab' || !process.env.FIRESTORE_EMULATOR_HOST)
  throw new Error('Isolated demo emulator required');
initializeApp({ projectId: 'demo-techlab' });
const db = getFirestore();
const uid = 'push-test-owner',
  outside = 'push-test-outsider';
await db.doc(`users/${uid}`).set({ role: 'praktikan' });
await db.doc(`users/${outside}`).set({ role: 'praktikan' });
await db
  .doc('classes/push-class')
  .set({
    studentIds: [uid],
    assistantIds: [],
    className: 'A',
    courseName: 'PPK',
    archivedAt: null,
  });
await db
  .doc('schedules/push-session')
  .set({
    title: 'UI',
    classId: 'push-class',
    location: 'Lab A',
    startAt: Timestamp.now(),
    endAt: Timestamp.now(),
    archivedAt: null,
  });
await db
  .doc('sessions/push-session')
  .set({
    status: 'scheduled',
    classId: 'push-class',
    scheduleId: 'push-session',
    studentIds: [uid, outside],
  });
await db.doc('sessions/push-session').update({ status: 'open' });
async function waitFor(count) {
  const until = Date.now() + 45000;
  while (Date.now() < until) {
    const snapshot = await db.collection(`users/${uid}/notifications`).get();
    if (snapshot.size >= count) return snapshot.docs.map((doc) => doc.data());
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('No trigger notification within 45s');
}
assert.equal((await waitFor(1))[0].type, 'session-opened');
await db.doc('schedules/push-session').update({ location: 'Lab B' });
assert.ok((await waitFor(2)).some((notice) => notice.type === 'schedule-changed'));
await db
  .doc('permissions/push-permission')
  .set({
    status: 'pending',
    userId: uid,
    classId: 'push-class',
    className: 'A',
    sessionTitle: 'UI',
  });
await db
  .doc('permissions/push-permission')
  .update({ status: 'rejected', decisionReason: 'Dokumen kurang lengkap' });
const notices = await waitFor(3);
assert.ok(notices.some((notice) => notice.body.includes('Dokumen kurang lengkap')));
assert.ok(notices.every((notice) => notice.delivery === 'no-device'));
assert.equal((await db.collection(`users/${outside}/notifications`).get()).size, 0);
assert.equal((await db.doc('sessions/push-session').get()).data().status, 'open');
assert.equal((await db.doc('permissions/push-permission').get()).data().status, 'rejected');
console.log(
  'PASS: real Firestore triggers: session, schedule, decision, scoped recipients, no-token fallback; source transactions preserved.',
);
await db.terminate();
