import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, test } from 'node:test';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
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

const startAt = Timestamp.fromMillis(Date.now() - 10 * 60 * 1000);
const endAt = Timestamp.fromMillis(Date.now() + 110 * 60 * 1000);

async function seedUser(uid, role = 'praktikan', number = '240101001') {
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'users', uid), {
      uid,
      name: role === 'asisten' ? 'Asisten Demo' : 'Praktikan Demo',
      number,
      role,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  });
}

async function seedAslab(uid, courseNames) {
  await seedUser(uid, 'admin');
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'aslabScopes', uid), { courseNames });
  });
}

async function seedClass(classId, assistantId, studentIds = [], courseName = 'Pemrograman Perangkat Bergerak') {
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'classes', classId), {
      className: 'Informatika A',
      courseName,
      assistantIds: [assistantId],
      studentIds,
      memberIds: [assistantId, ...studentIds],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      archivedAt: null,
    });
  });
}

async function seedParticipant(classId, userId, studentNumber) {
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'participants', `${classId}_${userId}`), {
      classId,
      userId,
      studentName: 'Praktikan Demo',
      studentNumber,
      joinedAt: Timestamp.now(),
      leftAt: null,
    });
  });
}

async function seedSchedule(scheduleId, classId) {
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'schedules', scheduleId), {
      classId,
      title: 'Pertemuan 5',
      startAt,
      endAt,
      location: 'Lab Informatika B',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      archivedAt: null,
    });
  });
}

async function seedSession(sessionId, scheduleId, classId, status = 'scheduled', studentIds = []) {
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'sessions', sessionId), {
      scheduleId,
      classId,
      studentIds,
      startAt,
      endAt,
      status,
      openedAt: status === 'scheduled' ? null : Timestamp.now(),
      closedAt: status === 'closed' ? Timestamp.now() : null,
      cancelledAt: null,
      openedBy: status === 'scheduled' ? null : 'asisten-1',
      closedBy: status === 'closed' ? 'asisten-1' : null,
      cancelledBy: null,
      createdBy: 'asisten-1',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  });
}

test('schedule overview allows empty membership queries but rejects unscoped and foreign queries', async () => {
  await seedUser('praktikan-1');
  await seedUser('asisten-1', 'asisten');
  for (const uid of ['praktikan-1', 'asisten-1']) {
    const db = env.authenticatedContext(uid).firestore();
    const result = await assertSucceeds(
      getDocs(query(collection(db, 'classes'), where(uid.startsWith('asisten') ? 'assistantIds' : 'studentIds', 'array-contains', uid))),
    );
    assert.equal(result.empty, true);
    await assertFails(getDocs(collection(db, 'classes')));
    await assertFails(
      getDocs(query(collection(db, 'classes'), where(uid.startsWith('asisten') ? 'assistantIds' : 'studentIds', 'array-contains', 'someone-else'))),
    );
  }
});

test('schedule overview queries work for both roles and deny unrelated schedules and sessions', async () => {
  await seedUser('asisten-1', 'asisten');
  await seedUser('praktikan-1');
  await seedUser('praktikan-2');
  await seedClass('class-1', 'asisten-1', ['praktikan-1']);
  await seedSchedule('schedule-1', 'class-1');
  await seedSession('schedule-1', 'schedule-1', 'class-1', 'open', ['praktikan-1']);
  for (const uid of ['asisten-1', 'praktikan-1']) {
    const db = env.authenticatedContext(uid).firestore();
    const classes = await assertSucceeds(
      getDocs(query(collection(db, 'classes'), where(uid.startsWith('asisten') ? 'assistantIds' : 'studentIds', 'array-contains', uid))),
    );
    assert.equal(classes.size, 1);
    for (const name of ['schedules', 'sessions']) {
      const result = await assertSucceeds(
        getDocs(query(collection(db, name), where('classId', '==', 'class-1'), orderBy('startAt', 'asc'))),
      );
      assert.equal(result.size, 1);
      const outsider = env.authenticatedContext('praktikan-2').firestore();
      await assertFails(
        getDocs(query(collection(outsider, name), where('classId', '==', 'class-1'), orderBy('startAt', 'asc'))),
      );
    }
  }
});

test('only a scoped Aslab can create a class and change its distribution', async () => {
  await seedUser('asisten-1', 'asisten');
  await seedUser('asisten-2', 'asisten');
  await seedUser('praktikan-1');

  await seedAslab('admin-1', ['Pemrograman Perangkat Bergerak']);
  const admin = env.authenticatedContext('admin-1').firestore();
  await assertSucceeds(
    setDoc(doc(admin, 'classes', 'class-1'), {
      className: 'Informatika A',
      courseName: 'Pemrograman Perangkat Bergerak',
      assistantIds: ['asisten-1'],
      studentIds: [],
      memberIds: ['asisten-1'],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      archivedAt: null,
    }),
  );

  const otherAssistant = env.authenticatedContext('asisten-2').firestore();
  await assertFails(
    updateDoc(doc(otherAssistant, 'classes', 'class-1'), {
      className: 'Hijack',
      updatedAt: serverTimestamp(),
    }),
  );

  const practitioner = env.authenticatedContext('praktikan-1').firestore();
  await assertFails(
    setDoc(doc(practitioner, 'classes', 'class-2'), {
      className: 'Kelas Palsu',
      courseName: 'Palsu',
      assistantIds: ['praktikan-1'],
      studentIds: [],
      memberIds: ['praktikan-1'],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      archivedAt: null,
    }),
  );
});

test('scoped Aslab adds participants with matching identities and Asprak cannot change distribution', async () => {
  await seedUser('asisten-1', 'asisten');
  await seedUser('praktikan-1', 'praktikan', '240101001');
  await seedUser('praktikan-2', 'praktikan', '240101002');
  await seedClass('class-1', 'asisten-1');

  await seedAslab('admin-1', ['Pemrograman Perangkat Bergerak']);
  const admin = env.authenticatedContext('admin-1').firestore();
  const assistant = env.authenticatedContext('asisten-1').firestore();
  const participant = {
    classId: 'class-1', userId: 'praktikan-1', studentName: 'Praktikan Demo',
    studentNumber: '240101001', joinedAt: serverTimestamp(), leftAt: null,
  };
  await assertFails(setDoc(doc(assistant, 'participants', 'class-1_praktikan-1'), participant));
  await assertFails(updateDoc(doc(assistant, 'classes', 'class-1'), {
    studentIds: ['praktikan-1'], memberIds: ['asisten-1', 'praktikan-1'], updatedAt: serverTimestamp(),
  }));
  await assertSucceeds(
    setDoc(doc(admin, 'participants', 'class-1_praktikan-1'), {
      classId: 'class-1',
      userId: 'praktikan-1',
      studentName: 'Praktikan Demo',
      studentNumber: '240101001',
      joinedAt: serverTimestamp(),
      leftAt: null,
    }),
  );
  await assertFails(
    setDoc(doc(admin, 'participants', 'class-1_praktikan-2'), {
      classId: 'class-1',
      userId: 'praktikan-2',
      studentName: 'Praktikan Demo 2',
      studentNumber: '999999',
      joinedAt: serverTimestamp(),
      leftAt: null,
    }),
  );
});

test('course and roster changes apply to an existing authenticated context', async () => {
  await seedAslab('admin-1', ['Basis Data']);
  await seedUser('asisten-1', 'asisten');
  await seedUser('praktikan-1');
  await seedClass('allowed', 'asisten-1', ['praktikan-1'], 'Basis Data');
  await seedClass('other', 'asisten-1', [], 'Jaringan');
  await seedSchedule('schedule-1', 'allowed');
  await seedSession('schedule-1', 'schedule-1', 'allowed');

  const admin = env.authenticatedContext('admin-1').firestore();
  const assistant = env.authenticatedContext('asisten-1').firestore();
  const student = env.authenticatedContext('praktikan-1').firestore();
  const guest = env.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(admin, 'classes', 'allowed')));
  await assertSucceeds(getDocs(query(collection(admin, 'classes'), where('courseName', 'in', ['Basis Data']))));
  await assertFails(getDoc(doc(admin, 'classes', 'other')));
  await assertFails(getDocs(collection(admin, 'classes')));
  await assertFails(setDoc(doc(admin, 'aslabScopes', 'admin-1'), { courseNames: ['Jaringan'] }));
  await assertSucceeds(getDoc(doc(assistant, 'sessions', 'schedule-1')));
  await assertSucceeds(getDoc(doc(student, 'sessions', 'schedule-1')));
  await assertFails(getDoc(doc(guest, 'sessions', 'schedule-1')));

  await assertSucceeds(updateDoc(doc(admin, 'classes', 'allowed'), {
    assistantIds: [], studentIds: [], memberIds: [], updatedAt: serverTimestamp(),
  }));
  await assertFails(getDoc(doc(assistant, 'sessions', 'schedule-1')));
  await assertFails(getDoc(doc(student, 'sessions', 'schedule-1')));
  await assertSucceeds(getDoc(doc(assistant, 'classes', 'other')));
});

test('practitioner reads only classes, schedules, and sessions of their enrollment', async () => {
  await seedUser('asisten-1', 'asisten');
  await seedUser('praktikan-1');
  await seedUser('praktikan-2');
  await seedClass('class-1', 'asisten-1', ['praktikan-1']);
  await seedParticipant('class-1', 'praktikan-1', '240101001');
  await seedSchedule('schedule-1', 'class-1');
  await seedSession('schedule-1', 'schedule-1', 'class-1', 'open');

  const enrolled = env.authenticatedContext('praktikan-1').firestore();
  await assertSucceeds(getDoc(doc(enrolled, 'classes', 'class-1')));
  await assertSucceeds(getDoc(doc(enrolled, 'schedules', 'schedule-1')));
  await assertSucceeds(getDoc(doc(enrolled, 'sessions', 'schedule-1')));

  const outsider = env.authenticatedContext('praktikan-2').firestore();
  await assertFails(getDoc(doc(outsider, 'classes', 'class-1')));
  await assertFails(getDoc(doc(outsider, 'schedules', 'schedule-1')));
  await assertFails(getDoc(doc(outsider, 'sessions', 'schedule-1')));
});

test('assistant opens and closes a session; closed session cannot be reopened', async () => {
  await seedUser('asisten-1', 'asisten');
  await seedUser('praktikan-1');
  await seedClass('class-1', 'asisten-1');
  await seedSchedule('schedule-1', 'class-1');
  await seedSession('schedule-1', 'schedule-1', 'class-1', 'scheduled');

  const assistant = env.authenticatedContext('asisten-1').firestore();
  await assertFails(
    updateDoc(doc(assistant, 'sessions', 'schedule-1'), {
      status: 'open',
      openedAt: serverTimestamp(),
      openedBy: 'asisten-2',
      updatedAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(
    updateDoc(doc(assistant, 'sessions', 'schedule-1'), {
      status: 'open',
      openedAt: serverTimestamp(),
      openedBy: 'asisten-1',
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(doc(assistant, 'sessions', 'schedule-1'), {
      status: 'closed',
      closedAt: serverTimestamp(),
      closedBy: 'asisten-2',
      updatedAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(
    updateDoc(doc(assistant, 'sessions', 'schedule-1'), {
      status: 'closed',
      closedAt: serverTimestamp(),
      closedBy: 'asisten-1',
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(doc(assistant, 'sessions', 'schedule-1'), {
      status: 'open',
      openedAt: serverTimestamp(),
      openedBy: 'asisten-1',
      updatedAt: serverTimestamp(),
    }),
  );

  const practitioner = env.authenticatedContext('praktikan-1').firestore();
  await assertFails(
    updateDoc(doc(practitioner, 'sessions', 'schedule-1'), {
      status: 'open',
      openedAt: serverTimestamp(),
      openedBy: 'praktikan-1',
      updatedAt: serverTimestamp(),
    }),
  );
});

test('attendance is one record per session and only for enrolled practitioners in open sessions', async () => {
  await seedUser('asisten-1', 'asisten');
  await seedUser('praktikan-1');
  await seedUser('praktikan-2');
  await seedClass('class-1', 'asisten-1', ['praktikan-1']);
  await seedParticipant('class-1', 'praktikan-1', '240101001');
  await seedSchedule('schedule-1', 'class-1');
  await seedSession('schedule-1', 'schedule-1', 'class-1', 'open', ['praktikan-1']);

  const practitioner = env.authenticatedContext('praktikan-1').firestore();
  const attendanceRef = doc(practitioner, 'attendances', 'schedule-1_praktikan-1');
  await assertSucceeds(
    setDoc(attendanceRef, {
      sessionId: 'schedule-1',
      classId: 'class-1',
      userId: 'praktikan-1',
      status: 'present',
      recordedAt: serverTimestamp(),
      latitude: -7.0482375,
      longitude: 110.440765625,
      accuracyMeters: 10,
      distanceMeters: 5,
      allowedRadiusMeters: 100,
      locationValidated: true,
      labName: 'Lab Informatika B',
    }),
  );
  await assertFails(
    setDoc(attendanceRef, {
      sessionId: 'schedule-1',
      classId: 'class-1',
      userId: 'praktikan-1',
      status: 'present',
      recordedAt: serverTimestamp(),
    }),
  );

  const outsider = env.authenticatedContext('praktikan-2').firestore();
  await assertFails(
    setDoc(doc(outsider, 'attendances', 'schedule-1_praktikan-2'), {
      sessionId: 'schedule-1',
      classId: 'class-1',
      userId: 'praktikan-2',
      status: 'present',
      recordedAt: serverTimestamp(),
      latitude: -7.0482375,
      longitude: 110.440765625,
      accuracyMeters: 10,
      distanceMeters: 5,
      allowedRadiusMeters: 100,
      locationValidated: true,
      labName: 'Lab Informatika B',
    }),
  );

  await seedSession('schedule-2', 'schedule-2', 'class-1', 'closed', ['praktikan-1']);
  await assertFails(
    setDoc(doc(practitioner, 'attendances', 'schedule-2_praktikan-1'), {
      sessionId: 'schedule-2',
      classId: 'class-1',
      userId: 'praktikan-1',
      status: 'present',
      recordedAt: serverTimestamp(),
      latitude: -7.0482375,
      longitude: 110.440765625,
      accuracyMeters: 10,
      distanceMeters: 5,
      allowedRadiusMeters: 100,
      locationValidated: true,
      labName: 'Lab Informatika B',
    }),
  );

  for (const [sessionId, invalidLocation] of [
    ['schedule-3', { distanceMeters: 101, allowedRadiusMeters: 100 }],
    ['schedule-4', { locationValidated: false }],
    ['schedule-5', { omitCoordinates: true }],
  ]) {
    await seedSession(sessionId, sessionId, 'class-1', 'open', ['praktikan-1']);
    const payload = {
      sessionId,
      classId: 'class-1',
      userId: 'praktikan-1',
      status: 'present',
      recordedAt: serverTimestamp(),
      latitude: -7.0482375,
      longitude: 110.440765625,
      accuracyMeters: 10,
      distanceMeters: 5,
      allowedRadiusMeters: 100,
      locationValidated: true,
      labName: 'Lab Informatika B',
      ...invalidLocation,
    };
    if (payload.omitCoordinates) {
      delete payload.latitude;
      delete payload.longitude;
      delete payload.omitCoordinates;
    }
    await assertFails(
      setDoc(doc(practitioner, 'attendances', `${sessionId}_praktikan-1`), payload),
    );
  }

  const assistant = env.authenticatedContext('asisten-1').firestore();
  const saved = await assertSucceeds(
    getDoc(doc(assistant, 'attendances', 'schedule-1_praktikan-1')),
  );
  assert.equal(saved.exists(), true);
  assert.equal(saved.data().userId, 'praktikan-1');
});

