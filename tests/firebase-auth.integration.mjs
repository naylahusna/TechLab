import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { createProfileRepository } from '../dist/tests/src/features/auth/profile-repository.js';
// The test-compiled repository is CommonJS; use the same SDK module instances.
const require = createRequire(import.meta.url);
const { initializeApp, deleteApp } = require('firebase/app');
const {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} = require('firebase/auth');
const {
  connectFirestoreEmulator,
  doc,
  getDoc,
  getFirestore,
  updateDoc,
} = require('firebase/firestore');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');

test('Authentication identity connects to profile create/recovery/edit and account isolation', async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST)
    throw new Error('Emulators required.');
  const projectId = 'demo-techlab-auth';
  const env = await initializeTestEnvironment({
    projectId,
    firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
  });
  const app = initializeApp({ projectId, apiKey: 'demo-key' }, `integration-${Date.now()}`);
  const auth = getAuth(app);
  connectAuthEmulator(auth, `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`, {
    disableWarnings: true,
  });
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
  const db = getFirestore(app);
  connectFirestoreEmulator(db, host, Number(port));
  const repository = createProfileRepository(db);
  const email = `student-${Date.now()}@example.com`;
  const password = 'TechLab-test-123';
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    const uid = user.uid;
    const ref = doc(db, 'users', uid);
    // Auth account without a profile models partial registration and recovery.
    assert.equal((await getDoc(ref)).exists(), false);
    await repository.create(uid, { name: 'Praktikan Baru', number: '240001' });
    assert.equal((await getDoc(ref)).data().role, 'praktikan');
    await assert.rejects(createUserWithEmailAndPassword(auth, email, password), {
      code: 'auth/email-already-in-use',
    });
    await repository.update(uid, { name: 'Nama Diperbarui', number: '240002' });
    assert.equal((await getDoc(ref)).data().name, 'Nama Diperbarui');
    await assert.rejects(updateDoc(ref, { role: 'asisten' }), { code: 'permission-denied' });
    await signOut(auth);
    assert.equal(auth.currentUser, null);
    await assert.rejects(signInWithEmailAndPassword(auth, email, 'wrong-password'));
    await signInWithEmailAndPassword(auth, email, password);
    assert.equal(auth.currentUser.uid, uid);
    assert.equal((await getDoc(ref)).data().name, 'Nama Diperbarui');
    // Operator-assigned roles survive profile-creation retries.
    await env.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), 'users', uid), { role: 'asisten' });
    });
    await repository.create(uid, { name: 'Must Not Overwrite', number: '999' });
    assert.equal((await getDoc(ref)).data().role, 'asisten');
    assert.equal((await getDoc(ref)).data().name, 'Nama Diperbarui');
    await deleteUser(auth.currentUser);
    const second = await createUserWithEmailAndPassword(auth, `second-${email}`, password);
    await assert.rejects(getDoc(ref), { code: 'permission-denied' });
    await repository.create(second.user.uid, { name: 'Akun Kedua', number: '240003' });
    await deleteUser(auth.currentUser);
  } finally {
    await deleteApp(app);
    await env.cleanup();
  }
});
