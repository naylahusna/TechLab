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
      getDocs(query(collection(db, 'classes'), where('memberIds', 'array-contains', uid))),
    );
    assert.equal(result.empty, true);
    await assertFails(getDocs(collection(db, 'classes')));
    await assertFails(
      getDocs(
        query(collection(db, 'classes'), where('memberIds', 'array-contains', 'someone-else')),
      ),
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
      getDocs(query(collection(db, 'classes'), where('memberIds', 'array-contains', uid))),
    );
    assert.equal(classes.size, 1);
    for (const name of ['schedules', 'sessions']) {
      const result = await assertSucceeds(
        getDocs(
          query(collection(db, name), where('classId', '==', 'class-1'), orderBy('startAt', 'asc')),
        ),
      );
      assert.equal(result.size, 1);
      const outsider = env.authenticatedContext('praktikan-2').firestore();
      await assertFails(
        getDocs(
          query(
            collection(outsider, name),
            where('classId', '==', 'class-1'),
            orderBy('startAt', 'asc'),
          ),
        ),
      );
    }
  }
});

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

test('asprak grant and revocation preserve the same UID and practitioner attendance', async () => {
  const uid = 'mahasiswa-1';
  await seedUser(uid);
  await seedUser('asisten-1', 'asisten');
  await seedClass('kelas-belajar', 'asisten-1', [uid]);
  await seedParticipant('kelas-belajar', uid, '240101001');
  await seedSchedule('sesi-belajar', 'kelas-belajar');
  await seedSession('sesi-belajar', 'sesi-belajar', 'kelas-belajar', 'open', [uid]);
  await seedClass('kelas-mengajar', uid);
  await seedSchedule('sesi-mengajar', 'kelas-mengajar');
  await seedSession('sesi-mengajar', 'sesi-mengajar', 'kelas-mengajar');
  await seedClass('kelas-lain', 'asisten-1');
  await seedSchedule('sesi-lain', 'kelas-lain');
  const db = env.authenticatedContext(uid).firestore();
  const historyRef = doc(db, 'attendances', `sesi-belajar_${uid}`);
  await assertSucceeds(
    setDoc(historyRef, {
      sessionId: 'sesi-belajar',
      classId: 'kelas-belajar',
      userId: uid,
      status: 'present',
      recordedAt: serverTimestamp(),
    }),
  );
  const original = (await getDoc(historyRef)).data();
  const openSession = () =>
    updateDoc(doc(db, 'sessions', 'sesi-mengajar'), {
      status: 'open',
      openedAt: serverTimestamp(),
      openedBy: uid,
      updatedAt: serverTimestamp(),
    });
  // Merely being listed on a class or supplying a client role does not grant asprak.
  await assertFails(openSession());
  await assertFails(
    updateDoc(doc(db, 'users', uid), {
      roles: ['praktikan', 'asisten'],
      updatedAt: serverTimestamp(),
    }),
  );
  await env.withSecurityRulesDisabled(async (context) => {
    await updateDoc(doc(context.firestore(), 'users', uid), { roles: ['praktikan', 'asisten'] });
  });
  await assertSucceeds(openSession());
  await assertFails(getDoc(doc(db, 'schedules', 'sesi-lain')));
  assert.deepEqual((await getDoc(historyRef)).data(), original);
  // Both permissions are usable on the same authenticated UID.
  await seedSession('sesi-belajar-2', 'sesi-belajar', 'kelas-belajar', 'open', [uid]);
  await assertSucceeds(
    setDoc(doc(db, 'attendances', `sesi-belajar-2_${uid}`), {
      sessionId: 'sesi-belajar-2',
      classId: 'kelas-belajar',
      userId: uid,
      status: 'present',
      recordedAt: serverTimestamp(),
    }),
  );
  await env.withSecurityRulesDisabled(async (context) => {
    await updateDoc(doc(context.firestore(), 'users', uid), { roles: ['praktikan'] });
  });
  await assertFails(
    updateDoc(doc(db, 'sessions', 'sesi-mengajar'), {
      status: 'closed',
      closedAt: serverTimestamp(),
      closedBy: uid,
      updatedAt: serverTimestamp(),
    }),
  );
  assert.deepEqual((await getDoc(historyRef)).data(), original);
});
