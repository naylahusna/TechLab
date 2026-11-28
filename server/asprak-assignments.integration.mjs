import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { deleteApp, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { createAttendanceApp } from './attendance.mjs';

test('SRS-02 revokes one or the last assignment and approves a reapplication with the same UID', async () => {
  const endpoint = process.env.FIRESTORE_EMULATOR_HOST;
  assert.match(endpoint ?? '', /^127\.0\.0\.1:\d+$/, 'Use a local Firestore emulator.');
  const projectId = 'demo-techlab-asprak';
  const firebase = initializeApp({ projectId }, 'assignment-test');
  const db = getFirestore(firebase);
  const env = await initializeTestEnvironment({
    projectId, firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
  });
  const app = createAttendanceApp({
    db, auth: { async verifyIdToken(token) {
      if (!['admin-a', 'admin-b', 'assistant'].includes(token)) throw new Error('Invalid token');
      return { uid: token };
    } },
  });
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  try {
    await env.clearFirestore();
    const stamp = FieldValue.serverTimestamp();
    const profile = { uid: 'assistant', name: 'Asprak Demo', number: '24001', role: 'asisten' };
    const student = { uid: 'student', name: profile.name, number: profile.number, role: 'praktikan' };
    const initial = db.batch();
    for (const [uid, courseName] of [['admin-a', 'PPK'], ['admin-b', 'Basis Data']]) {
      initial.set(db.doc(`users/${uid}`), { uid, role: 'admin' });
      initial.set(db.doc(`aslabScopes/${uid}`), { courseNames: [courseName] });
    }
    initial.set(db.doc('users/assistant'), { ...profile, practitionerUid: 'student', createdAt: stamp, updatedAt: stamp });
    initial.set(db.doc('userDirectory/assistant'), { ...profile, updatedAt: stamp });
    initial.set(db.doc('users/student'), student);
    initial.set(db.doc('labLocations/lab-b'), { name: 'Lab B', catalogVersion: 2 });
    initial.set(db.doc('courseLabSettings/course-Basis Data'), { courseName: 'Basis Data', labIds: ['lab-b'] });
    for (const [id, courseName] of [['class-a', 'PPK'], ['class-b', 'Basis Data']]) {
      initial.set(db.doc(`classes/${id}`), {
        courseName, className: id, assistantIds: ['assistant'], studentIds: ['student'],
        memberIds: ['assistant', 'student'], archivedAt: null,
        ...(id === 'class-b' ? { labId: 'lab-b', courseId: 'course-Basis Data' } : {}),
      });
      initial.set(db.doc(`sessions/${id}`), { classId: id, status: 'open' });
      initial.set(db.doc(`permissions/${id}_student`), { classId: id, userId: 'student', status: 'pending' });
      initial.set(db.doc(`attendances/${id}_student`), { classId: id, userId: 'student' });
    }
    await initial.commit();

    const request = async (actor, action, classId) => {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/api/asprak-assignments`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + actor, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, classId, uid: 'assistant' }),
      });
      return { status: response.status, data: await response.json() };
    };
    const assistant = env.authenticatedContext('assistant').firestore();
    const accessible = (name, id) => getDoc(doc(assistant, name, id));
    const exerciseReads = async (assertAccess, id) => {
      await assertAccess(accessible('sessions', id));
      await assertAccess(accessible('permissions', id + '_student'));
      await assertAccess(accessible('attendances', id + '_student'));
    };
    await exerciseReads(assertSucceeds, 'class-a');
    await exerciseReads(assertSucceeds, 'class-b');
    assert.equal((await request('invalid', 'revoke', 'class-a')).status, 401);
    assert.equal((await request('assistant', 'revoke', 'class-a')).status, 403);
    assert.equal((await request('admin-a', 'revoke', 'class-b')).status, 403);
    assert.deepEqual(await request('admin-a', 'revoke', 'class-a'), { status: 200, data: { role: 'asisten' } });
    await exerciseReads(assertFails, 'class-a');
    await exerciseReads(assertSucceeds, 'class-b');
    assert.deepEqual(await request('admin-b', 'revoke', 'class-b'), { status: 200, data: { role: 'asprak_dicabut' } });
    await exerciseReads(assertFails, 'class-b');
    assert.equal((await request('admin-a', 'approve', 'class-a')).status, 409);

    // Simulate residue from the legacy global revocation and use the same authenticated client.
    await db.doc('classes/class-b').update({ assistantIds: ['assistant'], memberIds: ['assistant', 'student'] });
    const reapply = writeBatch(assistant);
    reapply.update(doc(assistant, 'users', 'assistant'), {
      role: 'calon_asprak', reappliedAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
    reapply.update(doc(assistant, 'userDirectory', 'assistant'), { role: 'calon_asprak', updatedAt: serverTimestamp() });
    await assertSucceeds(reapply.commit());
    await exerciseReads(assertFails, 'class-b');
    assert.deepEqual(await request('admin-a', 'approve', 'class-a'), { status: 200, data: { role: 'asisten' } });
    await exerciseReads(assertSucceeds, 'class-a');
    await exerciseReads(assertFails, 'class-b');
    const restored = (await db.doc('users/assistant').get()).data();
    assert.equal(restored.uid, 'assistant');
    assert.equal(restored.practitionerUid, 'student');
    assert.equal(restored.number, profile.number);
    assert.equal((await db.doc('attendances/class-b_student').get()).exists, true);
    assert.deepEqual((await db.doc('classes/class-b').get()).data().memberIds, ['student']);
    assert.equal((await db.collection('asprakAssignmentHistory').get()).size, 3);

    assert.equal((await request('admin-a', 'assign', 'class-b')).status, 403);
    assert.deepEqual(await request('admin-b', 'assign', 'class-b'), { status: 200, data: { role: 'asisten' } });
    assert.deepEqual(await request('admin-b', 'assign', 'class-b'), { status: 200, data: { role: 'asisten' } });
    assert.deepEqual((await db.doc('classes/class-b').get()).data().assistantIds, ['assistant']);
    assert.equal((await db.collection('asprakAssignmentHistory').get()).size, 4);
    await exerciseReads(assertSucceeds, 'class-b');
    const concurrent = await Promise.all([request('admin-a', 'revoke', 'class-a'), request('admin-b', 'revoke', 'class-b')]);
    assert.deepEqual(concurrent.map((result) => result.status), [200, 200]);
    assert.equal((await db.doc('users/assistant').get()).data().role, 'asprak_dicabut');
    await exerciseReads(assertFails, 'class-a');
    await exerciseReads(assertFails, 'class-b');
    assert.equal((await request('admin-b', 'assign', 'class-b')).status, 409);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await env.cleanup();
    await deleteApp(firebase);
  }
});
