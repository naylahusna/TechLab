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
  deleteField,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
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
test('push tokens are private, owner-only and cannot be reassigned by another account', async () => {
  const token = 'ExpoPushToken[test-device]';
  const ref = (uid) => doc(env.authenticatedContext(uid).firestore(), 'userPushTokens', token);
  const fields = { uid: 'alice', token, platform: 'android', updatedAt: serverTimestamp() };
  await assertSucceeds(setDoc(ref('alice'), fields));
  await assertSucceeds(getDoc(ref('alice')));
  await assertFails(getDoc(ref('bob')));
  await assertFails(setDoc(ref('bob'), { ...fields, uid: 'bob' }));
  await assertFails(deleteDoc(ref('bob')));
  await assertSucceeds(deleteDoc(ref('alice')));
  await assertSucceeds(deleteDoc(ref('alice')));
  await assertSucceeds(setDoc(ref('bob'), { ...fields, uid: 'bob' }));
});
test('notification history is owner-readable and server-written; delivery tokens never readable by clients', async () => {
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'users/alice/notifications/n1'), { title: 'Sesi dibuka' });
    await setDoc(doc(context.firestore(), 'notificationDeliveries/n1'), { uid: 'alice', token: 'secret-token' });
  });
  const alice = env.authenticatedContext('alice').firestore();
  const bob = env.authenticatedContext('bob').firestore();
  await assertSucceeds(getDoc(doc(alice, 'users/alice/notifications/n1')));
  await assertFails(getDoc(doc(bob, 'users/alice/notifications/n1')));
  await assertFails(setDoc(doc(alice, 'users/alice/notifications/n1'), { title: 'Forged' }));
  await assertFails(getDoc(doc(alice, 'notificationDeliveries/n1')));
  await assertFails(setDoc(doc(alice, 'notificationDeliveries/new'), { uid: 'alice' }));
});
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
async function seedLabScope(uid) {
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'aslabScopes', uid), { courseNames: ['Basis Data', 'Praktikum'] });
  });
}

test('Aslab can create and edit lab locations with the required location schema', async () => {
  await seed('admin', 'admin');
  const db = env.authenticatedContext('admin').firestore();
  await seedLabScope('admin');
  const ref = doc(db, 'labLocations', 'lab-b');
  const location = {
    courseName: 'Basis Data',
    name: 'Lab Informatika B',
    latitude: -7.0482375,
    longitude: 110.440765625,
    radiusMeters: 100,
    building: 'Gedung E FSM UNDIP',
    floor: 2,
    plusCode: '',
    pointType: 'building_map_reference',
    roomCenterVerified: false,
    source: 'Google Maps business listing Plus Codes',
    caution: 'Building-level map reference only',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: 'admin',
  };
  await assertSucceeds(setDoc(ref, location));
  await assertFails(setDoc(doc(db, 'labLocations', 'outside'), { ...location, courseName: 'Jaringan' }));
  await assertSucceeds(updateDoc(ref, { name: 'Lab Informatika B Baru', updatedAt: serverTimestamp() }));
  await seed('assistant', 'asisten');
  const assistantDb = env.authenticatedContext('assistant').firestore();
  await assertFails(setDoc(doc(assistantDb, 'labLocations', 'assistant-lab'), { ...location, updatedBy: 'assistant' }));
  await assertFails(setDoc(doc(db, 'labLocations', 'invalid'), { ...location, id: 'invalid' }));
  for (const [index, overrides] of [
    { latitude: -91 },
    { latitude: 91 },
    { longitude: -181 },
    { longitude: 181 },
    { radiusMeters: 0 },
    { radiusMeters: -1 },
  ].entries()) {
    await assertFails(setDoc(doc(db, 'labLocations', `invalid-${index}`), { ...location, ...overrides }));
  }
});
test('practitioners cannot create, update, or delete lab locations', async () => {
  await seed('assistant', 'asisten');
  await seed('student', 'praktikan');
  await seed('admin', 'admin');
  const adminDb = env.authenticatedContext('admin').firestore();
  const studentDb = env.authenticatedContext('student').firestore();
  await seedLabScope('admin');
  const existing = doc(adminDb, 'labLocations', 'lab-b');
  await setDoc(existing, {
    courseName: 'Basis Data', name: 'Lab Informatika B', latitude: -7.0482375, longitude: 110.440765625,
    radiusMeters: 100, building: 'Gedung E FSM UNDIP', floor: 2, plusCode: '',
    pointType: 'building_map_reference', roomCenterVerified: false,
    source: 'Google Maps listing', caution: 'Building reference',
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(), updatedBy: 'admin',
  });
  await assertFails(setDoc(doc(studentDb, 'labLocations', 'student-lab'), {
    name: 'Lab Baru', latitude: 0, longitude: 0, radiusMeters: 100,
    building: 'Gedung E', floor: null, plusCode: '', pointType: 'building_map_reference',
    roomCenterVerified: false, source: 'test', caution: 'test',
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(), updatedBy: 'student',
  }));
  await assertFails(updateDoc(doc(studentDb, 'labLocations', 'lab-b'), { name: 'Lab Diubah', updatedAt: serverTimestamp() }));
  await assertFails(deleteDoc(doc(studentDb, 'labLocations', 'lab-b')));
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

test('attendance QR codes are assistant-only, tied to an open assigned session, and update safely', async () => {
  const now = Date.now();
  const expiresAt = Timestamp.fromMillis(now + 60_000);
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'users/assistant'), data('assistant', { role: 'asisten' }));
    await setDoc(doc(context.firestore(), 'users/student'), data('student'));
    await setDoc(doc(context.firestore(), 'classes/class-1'), { className: 'A', assistantIds: ['assistant'], studentIds: ['student'], memberIds: ['assistant', 'student'] });
    await setDoc(doc(context.firestore(), 'sessions/session-1'), { classId: 'class-1', status: 'open', endAt: expiresAt });
    await setDoc(doc(context.firestore(), 'participants/class-1_student'), { classId: 'class-1', userId: 'student', studentName: 'Student', studentNumber: '240001', joinedAt: Timestamp.fromMillis(now - 1000), leftAt: null });
  });
  const assistantDb = env.authenticatedContext('assistant').firestore();
  const studentDb = env.authenticatedContext('student').firestore();
  const ref = doc(assistantDb, 'attendanceQrSessions/session-1');
  const record = { sessionId: 'session-1', classId: 'class-1', assistantId: 'assistant', attendanceCode: 'TL-M8ABC123-ABCDEFGH', status: 'active', expiresAt, updatedAt: serverTimestamp() };
  await assertSucceeds(setDoc(ref, record));
  await assertSucceeds(getDoc(ref));
  await assertFails(getDoc(doc(studentDb, 'attendanceQrSessions/session-1')));
  const codeRef = doc(assistantDb, 'attendanceQrCodes/TL-M8ABC123-ABCDEFGH');
  await assertSucceeds(setDoc(codeRef, record));
  await assertSucceeds(getDoc(doc(studentDb, 'attendanceQrCodes/TL-M8ABC123-ABCDEFGH')));
  await assertSucceeds(updateDoc(ref, { status: 'disabled', updatedAt: serverTimestamp() }));
  await assertSucceeds(updateDoc(codeRef, { status: 'disabled', updatedAt: serverTimestamp() }));
  await assertFails(getDoc(doc(studentDb, 'attendanceQrCodes/TL-M8ABC123-ABCDEFGH')));
  await assertFails(updateDoc(doc(studentDb, 'attendanceQrSessions/session-1'), { attendanceCode: 'FORGED', updatedAt: serverTimestamp() }));
  await assertFails(getDocs(collection(assistantDb, 'attendanceQrSessions')));
});

test('Aslab approves a separate candidate only with a matching practitioner, then can revoke it', async () => {
  await seed('admin', 'admin');
  await seed('assistant', 'asisten');
  await seed('alice');
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'userDirectory', 'alice'), {
      uid: 'alice', name: 'Nama Praktikan', number: '240001', role: 'praktikan', updatedAt: serverTimestamp(),
    });
    await setDoc(doc(context.firestore(), 'users', 'mismatch'), data('mismatch', { number: '999' }));
  });

  const candidateDb = env.authenticatedContext('candidate').firestore();
  const candidateProfile = doc(candidateDb, 'users', 'candidate');
  const setup = writeBatch(candidateDb);
  setup.set(candidateProfile, data('candidate', { role: 'calon_asprak' }));
  setup.set(doc(candidateDb, 'userDirectory', 'candidate'), {
    uid: 'candidate', name: 'Nama Praktikan', number: '240001', role: 'calon_asprak', updatedAt: serverTimestamp(),
  });
  await assertSucceeds(setup.commit());
  await assertFails(getDocs(collection(candidateDb, 'labLocations')));
  await assertFails(getDocs(collection(candidateDb, 'userDirectory')));
  await assertFails(updateDoc(candidateProfile, { number: '999', updatedAt: serverTimestamp() }));

  const adminDb = env.authenticatedContext('admin').firestore();
  const profile = doc(adminDb, 'users', 'candidate');
  const directory = doc(adminDb, 'userDirectory', 'candidate');

  function assign(db, uid, role, extra = {}) {
    const batch = writeBatch(db);
    const fields = { role, updatedAt: serverTimestamp() };
    batch.update(doc(db, 'users', uid), { ...fields, ...extra });
    batch.update(doc(db, 'userDirectory', uid), fields);
    return batch.commit();
  }

  await assertSucceeds(getDocs(collection(adminDb, 'userDirectory')));
  await assertFails(getDoc(profile));
  await assertFails(assign(candidateDb, 'candidate', 'asisten', { practitionerUid: 'alice' }));
  await assertFails(assign(env.authenticatedContext('assistant').firestore(), 'candidate', 'asisten', { practitionerUid: 'alice' }));
  await assertFails(assign(adminDb, 'candidate', 'asisten', { practitionerUid: 'mismatch' }));
  await assertFails(assign(adminDb, 'candidate', 'asisten', { practitionerUid: 'candidate' }));
  await assertFails(assign(adminDb, 'candidate', 'admin'));
  await assertFails(assign(adminDb, 'alice', 'asisten', { practitionerUid: 'mismatch' }));
  await assertFails(updateDoc(profile, { role: 'asisten', practitionerUid: 'alice', updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(directory, { role: 'asisten', updatedAt: serverTimestamp() }));

  await assertSucceeds(runTransaction(adminDb, async (transaction) => {
    assert.equal((await transaction.get(directory)).data().role, 'calon_asprak');
    const fields = { role: 'asisten', updatedAt: serverTimestamp() };
    transaction.update(profile, { ...fields, practitionerUid: 'alice' });
    transaction.update(directory, fields);
  }));
  assert.equal((await getDoc(candidateProfile)).data().role, 'asisten');
  assert.equal((await getDoc(directory)).data().role, 'asisten');
  assert.equal((await getDoc(own('alice'))).data().role, 'praktikan');
  await assertSucceeds(getDocs(collection(candidateDb, 'labLocations')));

  await assertSucceeds(assign(adminDb, 'candidate', 'asprak_dicabut'));
  assert.equal((await getDoc(candidateProfile)).data().role, 'asprak_dicabut');
  assert.equal((await getDoc(directory)).data().role, 'asprak_dicabut');
  await assertFails(getDocs(collection(candidateDb, 'labLocations')));
  await assertFails(assign(adminDb, 'candidate', 'asisten', { practitionerUid: 'alice' }));
  await assertFails(updateDoc(doc(adminDb, 'users', 'admin'), { role: 'praktikan', updatedAt: serverTimestamp() }));
});

test('Aslab can reject a candidate and manage a class in their course scope', async () => {
  await seed('admin', 'admin');
  await seedLabScope('admin');
  await seed('rejected', 'calon_asprak');
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'userDirectory', 'rejected'), {
      uid: 'rejected', name: 'Nama Praktikan', number: '240001', role: 'calon_asprak', updatedAt: serverTimestamp(),
    });
  });
  const db = env.authenticatedContext('admin').firestore();
  const fields = { role: 'asprak_ditolak', updatedAt: serverTimestamp() };
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', 'rejected'), fields);
  batch.update(doc(db, 'userDirectory', 'rejected'), fields);
  await assertSucceeds(batch.commit());
  assert.equal((await getDoc(own('rejected'))).data().role, 'asprak_ditolak');
  const classRef = doc(db, 'classes', 'admin-class');
  await assertSucceeds(setDoc(classRef, {
    className: 'Informatika A', courseName: 'Praktikum', assistantIds: ['admin'], studentIds: [],
    memberIds: ['admin'], createdAt: serverTimestamp(), updatedAt: serverTimestamp(), archivedAt: null,
  }));
  await assertSucceeds(updateDoc(classRef, { className: 'Informatika B', updatedAt: serverTimestamp() }));
});

test('only eligible rejected applicants can continue as Practitioner using the same UID', async () => {
  await seed('admin', 'admin');
  const admin = env.authenticatedContext('admin').firestore();
  async function seedCandidate(uid, role = 'calon_asprak') {
    await seed(uid, role);
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'userDirectory', uid), {
        uid, name: 'Nama Praktikan', number: '240001', role, updatedAt: serverTimestamp(),
      });
    });
  }
  function updateAccount(db, uid, fields) {
    const batch = writeBatch(db);
    for (const path of ['users', 'userDirectory']) {
      batch.update(doc(db, path, uid), { ...fields, updatedAt: serverTimestamp() });
    }
    return batch.commit();
  }
  function continueAccount(uid, overrides = {}) {
    const db = env.authenticatedContext(uid).firestore();
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', uid), {
      role: 'praktikan', rejectionReason: deleteField(), updatedAt: serverTimestamp(), ...overrides,
    });
    batch.set(doc(db, 'userDirectory', uid), {
      uid, name: 'Nama Praktikan', number: '240001', role: 'praktikan', updatedAt: serverTimestamp(),
    });
    return batch.commit();
  }

  await seedCandidate('candidate');
  await seedCandidate('other');
  await seedCandidate('legacy', 'asprak_ditolak');
  const candidate = env.authenticatedContext('candidate').firestore();
  await assertFails(continueAccount('candidate'));
  await assertFails(continueAccount('legacy'));
  await assertFails(updateAccount(candidate, 'candidate', {
    role: 'asprak_ditolak', rejectionReason: 'no_practitioner_account',
  }));
  await assertSucceeds(updateAccount(admin, 'other', { role: 'asprak_ditolak', rejectionReason: 'other' }));
  await assertFails(continueAccount('other'));
  await assertFails(updateAccount(admin, 'other', { rejectionReason: 'no_practitioner_account' }));
  await assertSucceeds(updateAccount(admin, 'legacy', { rejectionReason: 'no_practitioner_account' }));
  await assertSucceeds(continueAccount('legacy'));

  await assertSucceeds(updateAccount(admin, 'candidate', {
    role: 'asprak_ditolak', rejectionReason: 'no_practitioner_account',
  }));
  const profile = doc(candidate, 'users', 'candidate');
  const directory = doc(candidate, 'userDirectory', 'candidate');
  await assertFails(updateDoc(profile, {
    role: 'praktikan', rejectionReason: deleteField(), updatedAt: serverTimestamp(),
  }));
  await assertFails(continueAccount('candidate', { role: 'asisten' }));
  await assertSucceeds(continueAccount('candidate'));
  for (const ref of [profile, directory]) {
    const data = (await getDoc(ref)).data();
    assert.equal(data.uid, 'candidate');
    assert.equal(data.role, 'praktikan');
    assert.equal(data.rejectionReason, undefined);
  }
});
