import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';

let env;
before(async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST)
    throw new Error('Run with the Firebase Firestore emulator; production tests are prohibited.');
  env = await initializeTestEnvironment({
    projectId: 'demo-techlab',
    firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
  });
});
beforeEach(async () => {
  await env.clearFirestore();
});
after(async () => {
  await env?.cleanup();
});
const data = (uid, overrides = {}) => ({
  uid,
  name: 'Nama Praktikan',
  number: '240001',
  role: 'praktikan',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...overrides,
});
const own = (uid = 'alice') => doc(env.authenticatedContext(uid).firestore(), 'users', uid);
async function seed(uid = 'alice', role = 'praktikan') {
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'users', uid), data(uid, { role }));
  });
}

test('owner creates, reads, and edits profile without changing identity or role', async () => {
  const ref = own();
  await assertSucceeds(setDoc(ref, data('alice')));
  await assertSucceeds(
    updateDoc(ref, { name: 'Nama Baru', number: '240002', updatedAt: serverTimestamp() }),
  );
  assert.equal((await assertSucceeds(getDoc(ref))).data().name, 'Nama Baru');
});
test('unauthenticated and other users cannot read or write profiles; lists are forbidden', async () => {
  await seed();
  for (const context of [
    env.unauthenticatedContext(),
    env.authenticatedContext('bob'),
    env.authenticatedContext('assistant', { role: 'asisten' }),
  ]) {
    const db = context.firestore();
    const ref = doc(db, 'users', 'alice');
    await assertFails(getDoc(ref));
    await assertFails(setDoc(ref, data('alice')));
    await assertFails(updateDoc(ref, { name: 'Hijacked', updatedAt: serverTimestamp() }));
    await assertFails(deleteDoc(ref));
    await assertFails(getDocs(collection(db, 'users')));
  }
  await assertFails(getDocs(collection(env.authenticatedContext('alice').firestore(), 'users')));
});
test('create rejects self-assigned assistant role, spoofed UID, arbitrary fields and stale timestamps', async () => {
  for (const overrides of [
    { role: 'asisten' },
    { role: 'admin' },
    { uid: 'bob' },
    { isAdmin: true },
    { createdAt: Timestamp.fromMillis(0) },
    { updatedAt: Timestamp.fromMillis(0) },
  ]) {
    await assertFails(setDoc(own(), data('alice', overrides)));
  }
});
test('create and update both enforce schema, field lengths, and types', async () => {
  const invalid = [
    { name: '' },
    { name: 'x'.repeat(101) },
    { name: ' Leading' },
    { name: 42 },
    { number: '' },
    { number: 'x'.repeat(33) },
    { number: 'invalid id' },
    { number: [] },
    { createdAt: 'yesterday' },
    { updatedAt: false },
  ];
  for (const fields of invalid) await assertFails(setDoc(own(), data('alice', fields)));
  const missing = data('alice');
  delete missing.number;
  await assertFails(setDoc(own(), missing));
  await seed();
  for (const fields of invalid)
    await assertFails(updateDoc(own(), { updatedAt: serverTimestamp(), ...fields }));
  await assertFails(setDoc(own(), missing));
});
test('owner cannot escalate, transfer ownership, delete, add fields, or change creation time', async () => {
  await seed();
  for (const fields of [
    { role: 'asisten' },
    { uid: 'bob' },
    { createdAt: serverTimestamp() },
    { extra: 'pollution' },
    { updatedAt: Timestamp.fromMillis(0) },
  ]) {
    await assertFails(updateDoc(own(), { updatedAt: serverTimestamp(), ...fields }));
  }
  await assertFails(deleteDoc(own()));
});
test('operator-provisioned assistant can edit own profile but cannot change own role', async () => {
  await seed('assistant', 'asisten');
  await assertSucceeds(
    updateDoc(own('assistant'), { name: 'Asisten Baru', updatedAt: serverTimestamp() }),
  );
  await assertFails(
    updateDoc(own('assistant'), { role: 'praktikan', updatedAt: serverTimestamp() }),
  );
});
test('unimplemented feature collections and orphan subcollections are denied', async () => {
  const db = env.authenticatedContext('alice').firestore();
  for (const path of [
    'sessions/session-1',
    'attendance/session-1_alice',
    'permissions/request-1',
    'users/alice/private/settings',
    'users/missing/private/settings',
  ]) {
    await assertFails(getDoc(doc(db, path)));
    await assertFails(setDoc(doc(db, path), { ownerId: 'alice' }));
  }
});
