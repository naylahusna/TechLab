import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, test } from 'node:test';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
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

const at = (iso) => Timestamp.fromDate(new Date(iso));
const startAt = at('2026-11-16T08:00:00+07:00');
const endAt = at('2026-11-16T10:00:00+07:00');

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

async function seedClass(classId, assistantId, studentIds = []) {
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'classes', classId), {
      className: 'Informatika A',
      courseName: 'Pemrograman Perangkat Bergerak',
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
      location: 'Lab Komputasi 1',
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
      createdBy: 'asisten-1',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  });
}

test('assistant creates a class with self and cannot manage another assistant class', async () => {
  await seedUser('asisten-1', 'asisten');
  await seedUser('asisten-2', 'asisten');
  await seedUser('praktikan-1');

  const assistant = env.authenticatedContext('asisten-1').firestore();
  await assertSucceeds(
    setDoc(doc(assistant, 'classes', 'class-1'), {
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

test('assistant adds participant only when identity number matches the user profile', async () => {
  await seedUser('asisten-1', 'asisten');
  await seedUser('praktikan-1', 'praktikan', '240101001');
  await seedUser('praktikan-2', 'praktikan', '240101002');
  await seedClass('class-1', 'asisten-1');

  const assistant = env.authenticatedContext('asisten-1').firestore();
  await assertSucceeds(
    setDoc(doc(assistant, 'participants', 'class-1_praktikan-1'), {
      classId: 'class-1',
      userId: 'praktikan-1',
      studentName: 'Praktikan Demo',
      studentNumber: '240101001',
      joinedAt: serverTimestamp(),
      leftAt: null,
    }),
  );
  await assertFails(
    setDoc(doc(assistant, 'participants', 'class-1_praktikan-2'), {
      classId: 'class-1',
      userId: 'praktikan-2',
      studentName: 'Praktikan Demo 2',
      studentNumber: '999999',
      joinedAt: serverTimestamp(),
      leftAt: null,
    }),
  );
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
  await assertSucceeds(
    updateDoc(doc(assistant, 'sessions', 'schedule-1'), {
      status: 'open',
      openedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(
    updateDoc(doc(assistant, 'sessions', 'schedule-1'), {
      status: 'closed',
      closedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(doc(assistant, 'sessions', 'schedule-1'), {
      status: 'open',
      openedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );

  const practitioner = env.authenticatedContext('praktikan-1').firestore();
  await assertFails(
    updateDoc(doc(practitioner, 'sessions', 'schedule-1'), {
      status: 'open',
      openedAt: serverTimestamp(),
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
    }),
  );

  const assistant = env.authenticatedContext('asisten-1').firestore();
  const saved = await assertSucceeds(
    getDoc(doc(assistant, 'attendances', 'schedule-1_praktikan-1')),
  );
  assert.equal(saved.exists(), true);
  assert.equal(saved.data().userId, 'praktikan-1');
});

