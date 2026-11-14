import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import {
  doc as adminDoc,
  setDoc as adminSetDoc,
  Timestamp as adminTimestamp,
} from 'firebase/firestore';

const require = createRequire(import.meta.url);
const { initializeApp, deleteApp } = require('firebase/app');
const {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} = require('firebase/auth');
const { connectFirestoreEmulator, getFirestore } = require('firebase/firestore');
const {
  createPracticumRepository,
} = require('../dist/tests/src/features/practicum/repository.js');

test('practicum repository completes assistant, practitioner, and recap flow', async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST)
    throw new Error('Both Firebase emulators are required. Production tests are prohibited.');

  const projectId = 'demo-techlab';
  const env = await initializeTestEnvironment({
    projectId,
    firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
  });
  const app = initializeApp({ projectId, apiKey: 'demo-key' }, `practicum-${Date.now()}`);
  const auth = getAuth(app);
  connectAuthEmulator(auth, `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`, {
    disableWarnings: true,
  });
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
  const db = getFirestore(app);
  connectFirestoreEmulator(db, host, Number(port));

  const suffix = Date.now();
  const assistantEmail = `asisten-${suffix}@example.com`;
  const practitionerEmail = `praktikan-${suffix}@example.com`;
  const password = 'TechLab-test-123';

  try {
    await env.clearFirestore();
    const assistantCredential = await createUserWithEmailAndPassword(
      auth,
      assistantEmail,
      password,
    );
    const assistantId = assistantCredential.user.uid;
    const practitionerCredential = await createUserWithEmailAndPassword(
      auth,
      practitionerEmail,
      password,
    );
    const practitionerId = practitionerCredential.user.uid;

    await env.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      const now = adminTimestamp.now();
      await adminSetDoc(adminDoc(adminDb, 'users', assistantId), {
        uid: assistantId,
        name: 'Asisten Demo',
        number: 'AS-001',
        role: 'asisten',
        createdAt: now,
        updatedAt: now,
      });
      await adminSetDoc(adminDoc(adminDb, 'users', practitionerId), {
        uid: practitionerId,
        name: 'Praktikan Demo',
        number: '240101001',
        role: 'praktikan',
        createdAt: now,
        updatedAt: now,
      });
      await adminSetDoc(adminDoc(adminDb, 'userDirectory', assistantId), {
        uid: assistantId,
        name: 'Asisten Demo',
        number: 'AS-001',
        role: 'asisten',
        updatedAt: now,
      });
      await adminSetDoc(adminDoc(adminDb, 'userDirectory', practitionerId), {
        uid: practitionerId,
        name: 'Praktikan Demo',
        number: '240101001',
        role: 'praktikan',
        updatedAt: now,
      });
    });

    await signInWithEmailAndPassword(auth, assistantEmail, password);
    const assistantRepo = createPracticumRepository(db);
    const classId = await assistantRepo.createClass(
      { className: 'Informatika A', courseName: 'Pemrograman Perangkat Bergerak' },
      assistantId,
    );
    await assistantRepo.addParticipant({
      classId,
      userId: practitionerId,
      studentName: 'Praktikan Demo',
      studentNumber: '240101001',
    });
    const scheduleId = await assistantRepo.createSchedule({
      classId,
      title: 'Pertemuan 5',
      startAt: new Date('2026-11-16T08:00:00+07:00'),
      endAt: new Date('2026-11-16T10:00:00+07:00'),
      location: 'Lab Komputasi 1',
    });
    const sessionId = await assistantRepo.createSessionFromSchedule(scheduleId, assistantId);
    await assistantRepo.openSession(sessionId);

    const assistantClasses = await assistantRepo.listClassesForAssistant(assistantId);
    assert.equal(assistantClasses.length, 1);
    assert.deepEqual(assistantClasses[0].studentIds, [practitionerId]);

    const directory = await assistantRepo.searchDirectoryUsers('240101001');
    assert.equal(directory.length, 1);
    assert.equal(directory[0].uid, practitionerId);

    const participants = await assistantRepo.listParticipants(classId);
    assert.equal(participants.length, 1);
    assert.equal(participants[0].studentName, 'Praktikan Demo');

    const assistantSchedules = await assistantRepo.listSchedulesForAssistant(assistantId);
    assert.equal(assistantSchedules.length, 1);
    const assistantSessions = await assistantRepo.listSessionsForAssistant(assistantId);
    assert.equal(assistantSessions.length, 1);

    const conflictClassId = await assistantRepo.createClass(
      { className: 'Informatika B', courseName: 'Basis Data' },
      assistantId,
    );
    const firstScheduleId = await assistantRepo.createSchedule({
      classId: conflictClassId,
      title: 'Jadwal A',
      startAt: new Date('2026-12-01T08:00:00+07:00'),
      endAt: new Date('2026-12-01T10:00:00+07:00'),
      location: 'Lab Komputasi 2',
    });
    await assert.rejects(
      () =>
        assistantRepo.createSchedule({
          classId: conflictClassId,
          title: 'Jadwal Bentrok',
          startAt: new Date('2026-12-01T09:00:00+07:00'),
          endAt: new Date('2026-12-01T11:00:00+07:00'),
          location: 'Lab Komputasi 2',
        }),
      /bentrok/i,
    );
    const backToBackScheduleId = await assistantRepo.createSchedule({
      classId: conflictClassId,
      title: 'Jadwal B',
      startAt: new Date('2026-12-01T10:00:00+07:00'),
      endAt: new Date('2026-12-01T12:00:00+07:00'),
      location: 'Lab Komputasi 2',
    });
    await assert.rejects(
      () =>
        assistantRepo.updateSchedule(backToBackScheduleId, {
          classId: conflictClassId,
          title: 'Jadwal B',
          startAt: new Date('2026-12-01T09:00:00+07:00'),
          endAt: new Date('2026-12-01T11:00:00+07:00'),
          location: 'Lab Komputasi 2',
        }),
      /bentrok/i,
    );
    await assistantRepo.updateSchedule(backToBackScheduleId, {
      classId: conflictClassId,
      title: 'Jadwal B',
      startAt: new Date('2026-12-01T10:00:00+07:00'),
      endAt: new Date('2026-12-01T12:00:00+07:00'),
      location: 'Lab Komputasi 2',
    });
    await assistantRepo.archiveSchedule(firstScheduleId);
    await assistantRepo.createSchedule({
      classId: conflictClassId,
      title: 'Jadwal C',
      startAt: new Date('2026-12-01T08:00:00+07:00'),
      endAt: new Date('2026-12-01T10:00:00+07:00'),
      location: 'Lab Komputasi 2',
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        stop();
        reject(new Error('Langganan overview jadwal tidak mengirim snapshot.'));
      }, 5000);
      const stop = assistantRepo.subscribeToScheduleOverview(assistantId, () => {
        clearTimeout(timeout);
        stop();
        resolve();
      });
    });

    await signOut(auth);
    await signInWithEmailAndPassword(auth, practitionerEmail, password);
    const practitionerRepo = createPracticumRepository(db);
    const practitionerClasses = await practitionerRepo.listClassesForPractitioner(practitionerId);
    assert.equal(practitionerClasses.length, 1);
    const practitionerSessions = await practitionerRepo.listSessionsForPractitioner(
      practitionerId,
    );
    assert.equal(practitionerSessions.length, 1);
    const practitionerSchedules = await practitionerRepo.listSchedulesForPractitioner(
      practitionerId,
    );
    assert.equal(practitionerSchedules.length, 1);
    assert.equal(await practitionerRepo.getAttendance(sessionId, practitionerId), null);

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        stop();
        reject(new Error('Langganan jadwal terlarang tidak memicu error.'));
      }, 5000);
      const stop = practitionerRepo.subscribeToSchedules(
        conflictClassId,
        () => {},
        (error) => {
          clearTimeout(timeout);
          stop();
          try {
            assert.ok(error instanceof Error);
            assert.ok(error.message.length > 0);
            resolve();
          } catch (cause) {
            reject(cause);
          }
        },
      );
    });

    await practitionerRepo.recordAttendance(sessionId, practitionerId);
    await assert.rejects(
      () => practitionerRepo.recordAttendance(sessionId, practitionerId),
      /sudah presensi/,
    );

    await signOut(auth);
    await signInWithEmailAndPassword(auth, assistantEmail, password);
    const attendance = await assistantRepo.listAttendance(sessionId);
    assert.equal(attendance.length, 1);
    assert.equal(attendance[0].userId, practitionerId);
    const permissions = await assistantRepo.listPermissions(sessionId, classId);
    assert.deepEqual(permissions, []);
    const recap = await assistantRepo.listRecap(sessionId);
    assert.equal(recap.length, 1);
    assert.equal(recap[0].status, 'present');
    await assistantRepo.closeSession(sessionId);

    await signOut(auth);
    await signInWithEmailAndPassword(auth, practitionerEmail, password);
    await assert.rejects(
      () => practitionerRepo.recordAttendance(sessionId, practitionerId),
      /saat sesi dibuka/,
    );
  } finally {
    await env.cleanup();
    await deleteApp(app);
  }
});
