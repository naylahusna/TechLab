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
const { connectFirestoreEmulator, doc, getFirestore, serverTimestamp, setDoc } = require('firebase/firestore');
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
      await Promise.all(
        [
          { name: 'Lab Informatika B', latitude: -7.0482375, longitude: 110.440765625 },
          { name: 'Lab Informatika C', latitude: -7.0482375, longitude: 110.440765625 },
        ].map((lab) =>
          adminSetDoc(adminDoc(adminDb, 'labLocations', lab.name.toLowerCase().replaceAll(' ', '-')), {
            ...lab,
            radiusMeters: 100,
          }),
        ),
      );
    });

    await signInWithEmailAndPassword(auth, assistantEmail, password);
    const assistantRepo = createPracticumRepository(db);
    const classId = await env.withSecurityRulesDisabled(async (context) => {
      const setupRepo = createPracticumRepository(context.firestore());
      const id = await setupRepo.createClass(
        { className: 'Informatika A', courseName: 'Pemrograman Perangkat Bergerak' },
        assistantId,
      );
      await setupRepo.addParticipant({
        classId: id,
        userId: practitionerId,
        studentName: 'Praktikan Demo',
        studentNumber: '240101001',
      });
      return id;
    });
    const activeStartAt = new Date(Date.now() - 10 * 60_000);
    const activeEndAt = new Date(Date.now() + 110 * 60_000);
    const scheduleId = await assistantRepo.createSchedule({
      classId,
      title: 'Pertemuan 5',
      startAt: activeStartAt,
      endAt: activeEndAt,
      location: 'Lab Informatika B',
    });
    const autoCreatedSession = await assistantRepo.getSession(scheduleId);
    assert.ok(autoCreatedSession);
    assert.equal(autoCreatedSession.status, 'scheduled');
    assert.deepEqual(autoCreatedSession.studentIds, [practitionerId]);

    const sessionId = await assistantRepo.createSessionFromSchedule(scheduleId, assistantId);
    await assistantRepo.openSession(sessionId, assistantId);
    const openedSession = await assistantRepo.getSession(sessionId);
    assert.equal(openedSession.openedBy, assistantId);
    assert.equal(openedSession.closedBy, null);
    const attendanceCode = 'TL-PRAC123-ABCDEFGH';
    const qrPayload = {
      sessionId,
      classId,
      assistantId,
      attendanceCode,
      status: 'active',
      expiresAt: openedSession.endAt,
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'attendanceQrSessions', sessionId), qrPayload);
    await setDoc(doc(db, 'attendanceQrCodes', attendanceCode), qrPayload);

    const assistantClasses = await assistantRepo.listClassesForAssistant(assistantId);
    assert.equal(assistantClasses.length, 1);
    assert.deepEqual(assistantClasses[0].studentIds, [practitionerId]);

    await assert.rejects(() => assistantRepo.searchDirectoryUsers('240101001'), { code: 'permission-denied' });

    const participants = await assistantRepo.listParticipants(classId);
    assert.equal(participants.length, 1);
    assert.equal(participants[0].studentName, 'Praktikan Demo');

    const assistantSchedules = await assistantRepo.listSchedulesForAssistant(assistantId);
    assert.equal(assistantSchedules.length, 1);
    const assistantSessions = await assistantRepo.listSessionsForAssistant(assistantId);
    assert.equal(assistantSessions.length, 1);

    const conflictClassId = await env.withSecurityRulesDisabled((context) =>
      createPracticumRepository(context.firestore()).createClass(
        { className: 'Informatika B', courseName: 'Basis Data' },
        assistantId,
      ),
    );
    const firstScheduleId = await assistantRepo.createSchedule({
      classId: conflictClassId,
      title: 'Jadwal A',
      startAt: new Date('2026-12-01T08:00:00+07:00'),
      endAt: new Date('2026-12-01T10:00:00+07:00'),
      location: 'Lab Informatika C',
    });
    await assert.rejects(
      () => assistantRepo.openSession(firstScheduleId, assistantId, new Date('2026-12-01T10:05:00+07:00')),
      /sudah lewat/i,
    );
    await assert.rejects(
      () =>
        assistantRepo.createSchedule({
          classId: conflictClassId,
          title: 'Jadwal Bentrok',
          startAt: new Date('2026-12-01T09:00:00+07:00'),
          endAt: new Date('2026-12-01T11:00:00+07:00'),
          location: 'Lab Informatika C',
        }),
      /bentrok/i,
    );
    const backToBackScheduleId = await assistantRepo.createSchedule({
      classId: conflictClassId,
      title: 'Jadwal B',
      startAt: new Date('2026-12-01T10:00:00+07:00'),
      endAt: new Date('2026-12-01T12:00:00+07:00'),
      location: 'Lab Informatika C',
    });
    await assert.rejects(
      () =>
        assistantRepo.updateSchedule(backToBackScheduleId, {
          classId: conflictClassId,
          title: 'Jadwal B',
          startAt: new Date('2026-12-01T09:00:00+07:00'),
          endAt: new Date('2026-12-01T11:00:00+07:00'),
          location: 'Lab Informatika C',
        }),
      /bentrok/i,
    );
    await assistantRepo.updateSchedule(backToBackScheduleId, {
      classId: conflictClassId,
      title: 'Jadwal B',
      startAt: new Date('2026-12-01T10:00:00+07:00'),
      endAt: new Date('2026-12-01T12:00:00+07:00'),
      location: 'Lab Informatika C',
    });
    await assistantRepo.archiveSchedule(firstScheduleId);
    await assistantRepo.createSchedule({
      classId: conflictClassId,
      title: 'Jadwal C',
      startAt: new Date('2026-12-01T08:00:00+07:00'),
      endAt: new Date('2026-12-01T10:00:00+07:00'),
      location: 'Lab Informatika C',
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

    await assert.rejects(
      () => practitionerRepo.recordAttendance(sessionId, practitionerId, {
        latitude: 0,
        longitude: 0,
        accuracy: 10,
      }, 'lab-informatika-b', attendanceCode),
      /di luar radius/i,
    );
    await assert.rejects(
      () => practitionerRepo.recordAttendance(sessionId, practitionerId),
      /koordinat perangkat/i,
    );
    await assert.rejects(
      () => practitionerRepo.recordAttendance(sessionId, practitionerId, {
        latitude: -7.0482375,
        longitude: 110.440765625,
        accuracy: 10,
      }, 'lab-informatika-b', 'TL-INVALID-00000000'),
      /barcode presensi tidak valid/i,
    );
    await practitionerRepo.recordAttendance(sessionId, practitionerId, {
      latitude: -7.0482375,
      longitude: 110.440765625,
      accuracy: 10,
    }, 'lab-informatika-b', attendanceCode);
    await assert.rejects(
      () => practitionerRepo.recordAttendance(sessionId, practitionerId, {
        latitude: -7.0482375,
        longitude: 110.440765625,
        accuracy: 10,
      }, 'lab-informatika-b', attendanceCode),
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
    await assistantRepo.closeSession(sessionId, assistantId);
    const closedSession = await assistantRepo.getSession(sessionId);
    assert.equal(closedSession.openedBy, assistantId);
    assert.equal(closedSession.closedBy, assistantId);
    await env.withSecurityRulesDisabled(async (context) => {
      await adminSetDoc(adminDoc(context.firestore(), 'attendances', `${sessionId}_legacy-user`), {
        sessionId,
        classId,
        userId: 'legacy-user',
        status: 'present',
        recordedAt: adminTimestamp.now(),
      });
    });
    const recordsWithLegacy = await assistantRepo.listAttendance(sessionId);
    assert.equal(recordsWithLegacy.length, 2);
    const legacyAttendance = recordsWithLegacy.find((item) => item.userId === 'legacy-user');
    assert.equal(legacyAttendance.latitude, null);
    assert.equal(legacyAttendance.longitude, null);
    assert.equal(legacyAttendance.distanceMeters, null);
    assert.equal(legacyAttendance.allowedRadiusMeters, null);
    assert.equal(legacyAttendance.locationValidated, false);
    assert.equal(legacyAttendance.labName, null);

    await signOut(auth);
    await signInWithEmailAndPassword(auth, practitionerEmail, password);
    await assert.rejects(
      () => practitionerRepo.recordAttendance(sessionId, practitionerId, {
        latitude: -7.0482375,
        longitude: 110.440765625,
        accuracy: 10,
      }, 'lab-informatika-b', attendanceCode),
      /saat sesi dibuka/,
    );
  } finally {
    await env.cleanup();
    await deleteApp(app);
  }
});
