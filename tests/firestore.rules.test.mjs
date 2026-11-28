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
async function seedLabScope(uid, courseNames = ['Basis Data', 'Praktikum']) {
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'aslabScopes', uid), { courseNames });
  });
}

function locationFields(uid) {
  return {
    name: 'Lab Informatika B', latitude: -7.0482375, longitude: 110.440765625, radiusMeters: 100,
    building: 'Gedung E FSM UNDIP', floor: 2, plusCode: '',
    pointType: 'building_map_reference', roomCenterVerified: false,
    source: 'Google Maps listing', caution: 'Building reference',
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(), updatedBy: uid,
  };
}

function catalogBatch(db) {
  const batch = writeBatch(db);
  batch.set(doc(db, 'labCatalogRevisions', 'catalog'), { updatedAt: serverTimestamp() });
  return batch;
}

function createLab(db, id, courseName, fields) {
  const batch = catalogBatch(db);
  batch.set(doc(db, 'labLocations', id), { ...fields, catalogVersion: 2 });
  batch.set(doc(db, 'labManagers', id), { courseName });
  return batch.commit();
}

function updateLab(db, id, fields) {
  const batch = catalogBatch(db);
  batch.update(doc(db, 'labLocations', id), { ...fields, updatedAt: serverTimestamp() });
  return batch.commit();
}

function saveCourseSettings(db, key, courseName, graceMinutes, labIds = ['lab-b']) {
  const batch = catalogBatch(db);
  batch.set(doc(db, 'courseLabSettings', key), { courseName, graceMinutes, labIds, updatedAt: serverTimestamp() });
  return batch.commit();
}

test('one physical lab can serve two courses with independent grace and scoped editing', async () => {
  await seed('admin', 'admin');
  await seed('other-admin', 'admin');
  await seedLabScope('admin', ['Basis Data']);
  await seedLabScope('other-admin', ['Praktikum/PPK%']);
  const db = env.authenticatedContext('admin').firestore();
  const other = env.authenticatedContext('other-admin').firestore();
  await assertSucceeds(createLab(db, 'lab-b', 'Basis Data', locationFields('admin')));
  await assertSucceeds(saveCourseSettings(db, 'course-Basis Data', 'Basis Data', 5));
  await assertSucceeds(saveCourseSettings(other, 'course-Praktikum%2FPPK%25', 'Praktikum/PPK%', 10));
  await assertFails(saveCourseSettings(db, 'course-Praktikum%2FPPK%25', 'Praktikum/PPK%', 20));
  await assertFails(saveCourseSettings(db, 'course-Praktikum%2FPPK%25', 'Basis Data', 20));
  await assertFails(updateLab(other, 'lab-b', { radiusMeters: 500, updatedBy: 'other-admin' }));
  await assertSucceeds(updateLab(db, 'lab-b', { radiusMeters: 125, updatedBy: 'admin' }));
  assert.equal((await getDoc(doc(other, 'labLocations', 'lab-b'))).data().radiusMeters, 125);
  assert.equal((await getDoc(doc(db, 'courseLabSettings', 'course-Basis Data'))).data().graceMinutes, 5);
  assert.equal((await getDoc(doc(other, 'courseLabSettings', 'course-Praktikum%2FPPK%25'))).data().graceMinutes, 10);
  await assertFails(saveCourseSettings(db, 'course-Basis Data', 'Basis Data', 5, ['lab-b', 'bad/id']));
  await assertFails(saveCourseSettings(db, 'course-Basis Data', 'Basis Data', 5, []));
  for (const invalid of [-1, 1.5, '5']) {
    await assertFails(saveCourseSettings(db, 'course-Basis Data', 'Basis Data', invalid));
  }
});

test('physical lab validates coordinates, protects legacy fields, and keeps archive readable', async () => {
  await seed('admin', 'admin');
  await seedLabScope('admin');
  const db = env.authenticatedContext('admin').firestore();
  const location = locationFields('admin');
  await assertSucceeds(createLab(db, 'lab-b', 'Basis Data', location));
  await assertFails(createLab(db, 'outside', 'Jaringan', location));
  for (const [index, overrides] of [
    { latitude: -91 }, { longitude: 181 }, { radiusMeters: 0 }, { latitude: NaN },
    { graceMinutes: 5 }, { courseName: 'Basis Data' },
  ].entries()) {
    await assertFails(createLab(db, `invalid-${index}`, 'Basis Data', { ...location, ...overrides }));
  }
  const ref = doc(db, 'labLocations', 'lab-b');
  await assertSucceeds(updateLab(db, 'lab-b', { archivedAt: serverTimestamp() }));
  await assertSucceeds(getDoc(ref));
  await assertFails(updateLab(db, 'lab-b', { archivedAt: null }));
  await assertFails(deleteDoc(ref));
});

test('legacy lab stays readable and an in-scope Aslab can edit it using its existing ID', async () => {
  await seed('admin', 'admin');
  await seedLabScope('admin');
  await env.withSecurityRulesDisabled((context) =>
    setDoc(doc(context.firestore(), 'labLocations', 'legacy'), {
      ...locationFields('admin'), courseName: 'Basis Data', graceMinutes: 15,
    }),
  );
  const db = env.authenticatedContext('admin').firestore();
  await assertSucceeds(updateLab(db, 'legacy', { radiusMeters: 130 }));
  await assertFails(updateLab(db, 'legacy', { graceMinutes: 30 }));
  const existing = (await getDoc(doc(db, 'labLocations', 'legacy'))).data();
  assert.equal(existing.graceMinutes, 15);
  assert.equal(existing.radiusMeters, 130);
});

test('practitioners cannot write the catalog or course settings', async () => {
  await seed('student', 'praktikan');
  const student = env.authenticatedContext('student').firestore();
  await assertFails(createLab(student, 'lab-b', 'Basis Data', locationFields('student')));
  await assertFails(saveCourseSettings(student, 'course-Basis Data', 'Basis Data', 10));
});

test('new schedule labId must reference an active lab linked to the class course', async () => {
  await seed('admin', 'admin');
  await seed('assistant', 'asisten');
  await seedLabScope('admin');
  const admin = env.authenticatedContext('admin').firestore();
  const db = env.authenticatedContext('assistant').firestore();
  await assertSucceeds(createLab(admin, 'lab-b', 'Basis Data', locationFields('admin')));
  await assertSucceeds(saveCourseSettings(admin, 'course-Basis Data', 'Basis Data', 5));
  await env.withSecurityRulesDisabled(async (context) => {
    const seedDb = context.firestore();
    for (const [id, courseName] of [['class-bd', 'Basis Data'], ['class-ppk', 'Praktikum']]) {
      await setDoc(doc(seedDb, 'classes', id), { courseName, assistantIds: ['assistant'], studentIds: [] });
    }
  });
  const fields = {
    labId: 'lab-b', location: 'Lab Informatika B', title: 'Praktikum', classId: 'class-bd',
    startAt: new Date('2026-12-01T01:00:00Z'), endAt: new Date('2026-12-01T02:00:00Z'),
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(), archivedAt: null,
  };
  await assertSucceeds(setDoc(doc(db, 'schedules', 'bd'), fields));
  await assertFails(setDoc(doc(db, 'schedules', 'ppk'), { ...fields, classId: 'class-ppk' }));
  await assertSucceeds(saveCourseSettings(admin, 'course-Praktikum', 'Praktikum', 10, []));
  await assertFails(setDoc(doc(db, 'schedules', 'ppk'), { ...fields, classId: 'class-ppk' }));
  await assertSucceeds(saveCourseSettings(admin, 'course-Praktikum', 'Praktikum', 10));
  await assertSucceeds(setDoc(doc(db, 'schedules', 'ppk'), { ...fields, classId: 'class-ppk' }));
  await assertSucceeds(updateLab(admin, 'lab-b', { archivedAt: serverTimestamp() }));
  await assertFails(setDoc(doc(db, 'schedules', 'archived'), fields));
  await assertSucceeds(updateDoc(doc(db, 'schedules', 'bd'), { title: 'Judul baru', updatedAt: serverTimestamp() }));
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

test('approval and revocation require the backend, and the same account can reapply', async () => {
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

  await assertFails(assign(adminDb, 'candidate', 'asisten', { practitionerUid: 'alice' }));
  await env.withSecurityRulesDisabled(async (context) => {
    const control = context.firestore();
    const batch = writeBatch(control);
    batch.update(doc(control, 'users', 'candidate'), { role: 'asisten', practitionerUid: 'alice', updatedAt: serverTimestamp() });
    batch.update(doc(control, 'userDirectory', 'candidate'), { role: 'asisten', updatedAt: serverTimestamp() });
    await batch.commit();
  });
  await assertSucceeds(getDocs(collection(candidateDb, 'labLocations')));
  await assertFails(assign(adminDb, 'candidate', 'asprak_dicabut'));
  await env.withSecurityRulesDisabled(async (context) => {
    const control = context.firestore();
    const batch = writeBatch(control);
    batch.update(doc(control, 'users', 'candidate'), { role: 'asprak_dicabut', updatedAt: serverTimestamp() });
    batch.update(doc(control, 'userDirectory', 'candidate'), { role: 'asprak_dicabut', updatedAt: serverTimestamp() });
    await batch.commit();
  });
  await assertFails(getDocs(collection(candidateDb, 'labLocations')));
  await assertFails(updateDoc(candidateProfile, {
    role: 'calon_asprak', reappliedAt: serverTimestamp(), updatedAt: serverTimestamp(),
  }));
  const resubmit = () => {
    const batch = writeBatch(candidateDb);
    const fields = { role: 'calon_asprak', updatedAt: serverTimestamp() };
    batch.update(candidateProfile, { ...fields, reappliedAt: serverTimestamp() });
    batch.update(doc(candidateDb, 'userDirectory', 'candidate'), fields);
    return batch.commit();
  };
  await assertSucceeds(resubmit());
  await assertFails(resubmit());
  const stored = (await getDoc(candidateProfile)).data();
  assert.equal(stored.uid, 'candidate');
  assert.equal(stored.practitionerUid, 'alice');
  assert.equal(stored.number, '240001');
  assert.equal(stored.role, 'calon_asprak');
  await assertFails(getDocs(collection(candidateDb, 'labLocations')));
  await assertFails(assign(candidateDb, 'candidate', 'asisten', { practitionerUid: 'alice' }));
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
    className: 'Informatika A', courseName: 'Praktikum', assistantIds: [], studentIds: [],
    memberIds: [], createdAt: serverTimestamp(), updatedAt: serverTimestamp(), archivedAt: null,
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
