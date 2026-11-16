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
const { getAuth, connectAuthEmulator, createUserWithEmailAndPassword } = require('firebase/auth');
const {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  updateDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} = require('firebase/firestore');
const {
  createPermissionRepository,
} = require('../dist/tests/src/features/permission/repository.js');
const { createPracticumRepository } = require('../dist/tests/src/features/practicum/repository.js');

test('permission SRS-13/15/16/17: authenticated submit, isolation, race protection, live decision, recap and persistence', async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST)
    throw new Error('Only local emulators are allowed.');
  const projectId = 'demo-techlab';
  const env = await initializeTestEnvironment({
    projectId,
    firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
  });
  const apps = [];
  const stops = [];
  const clients = [];
  try {
    await env.clearFirestore();
    for (let i = 0; i < 5; i++) {
      const app = initializeApp({ projectId, apiKey: 'demo-key' }, `permission-${Date.now()}-${i}`);
      apps.push(app);
      const auth = getAuth(app);
      connectAuthEmulator(auth, `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`, {
        disableWarnings: true,
      });
      const db = getFirestore(app);
      const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
      connectFirestoreEmulator(db, host, Number(port));
      const { user } = await createUserWithEmailAndPassword(
        auth,
        `permission-${Date.now()}-${i}@example.com`,
        'Demo-Test-123!',
      );
      const profile = {
        uid: user.uid,
        role: i < 2 ? 'asisten' : 'praktikan',
        name: `Pengguna ${i}`,
        number: `TEST-${i}`,
        roles: i <= 2 ? ['praktikan', 'asisten'] : ['praktikan'],
      };
      clients.push({
        app,
        auth,
        db,
        profile,
        permissions: createPermissionRepository(db),
        practicum: createPracticumRepository(db),
      });
      await env.withSecurityRulesDisabled(async (context) =>
        adminSetDoc(adminDoc(context.firestore(), 'users', user.uid), {
          ...profile,
          // Exercise both stored defaults independently of the selected UI mode.
          role: i === 2 ? 'asisten' : 'praktikan',
          createdAt: adminTimestamp.now(),
          updatedAt: adminTimestamp.now(),
        }),
      );
    }
    const [assistant, otherAssistant, student, student2, outsider] = clients;
    const classId = await assistant.practicum.createClass(
      { className: 'Kelas Izin', courseName: 'PPK' },
      assistant.profile.uid,
    );
    for (const participant of [student, student2])
      await assistant.practicum.addParticipant({
        classId,
        userId: participant.profile.uid,
        studentName: participant.profile.name,
        studentNumber: participant.profile.number,
      });
    const taughtClassId = await student.practicum.createClass(
      { className: 'Kelas Diampu Mahasiswa', courseName: 'Kelas Asprak' },
      student.profile.uid,
    );
    assert.deepEqual(
      (await student.practicum.listClassesForAssistant(student.profile.uid)).map((item) => item.id),
      [taughtClassId],
    );
    assert.deepEqual(
      (await student.practicum.listClassesForPractitioner(student.profile.uid)).map(
        (item) => item.id,
      ),
      [classId],
    );
    const scheduleId = await assistant.practicum.createSchedule({
      classId,
      title: 'Sesi Integrasi Izin',
      startAt: new Date('2026-12-01T08:00:00+07:00'),
      endAt: new Date('2026-12-01T10:00:00+07:00'),
      location: 'Lab 1',
    });
    const sessionId = await assistant.practicum.createSessionFromSchedule(
      scheduleId,
      assistant.profile.uid,
    );
    await assistant.practicum.openSession(sessionId, assistant.profile.uid);
    const input = {
      sessionId,
      reason: 'Sedang sakit dan harus beristirahat.',
      kind: 'sakit',
      aiConsent: false,
    };
    await assert.rejects(() => outsider.permissions.submit(outsider.profile, input));
    await assert.rejects(() => assistant.permissions.submit(assistant.profile, input));
    await assert.rejects(() =>
      student.permissions.submit(student.profile, { ...input, reason: 'x' }),
    );
    const outcomes = await Promise.allSettled([
      student.permissions.submit(student.profile, input),
      student.permissions.submit(student.profile, input),
    ]);
    assert.equal(outcomes.filter((r) => r.status === 'fulfilled').length, 1);
    const id = `${sessionId}_${student.profile.uid}`;
    const ownRef = doc(student.db, 'permissions', id);
    const own = (await getDoc(ownRef)).data();
    assert.equal(own.status, 'pending');
    assert.equal(own.aiStatus, 'unavailable');
    assert.equal(own.aiCategory, null);
    assert.ok(own.createdAt.toMillis() > 0);
    assert.equal(own.studentNumber, student.profile.number);
    const privateList = await getDocs(
      query(collection(student.db, 'permissions'), where('userId', '==', student.profile.uid)),
    );
    assert.equal(privateList.size, 1);
    await assert.rejects(getDoc(doc(outsider.db, 'permissions', id)));
    await assert.rejects(getDocs(collection(student.db, 'permissions')));
    await assert.rejects(updateDoc(ownRef, { status: 'approved', updatedAt: serverTimestamp() }));
    await assert.rejects(
      updateDoc(ownRef, {
        reason: 'Diganti setelah pengajuan tersimpan.',
        updatedAt: serverTimestamp(),
      }),
    );
    await assert.rejects(
      updateDoc(ownRef, {
        aiStatus: 'completed',
        aiCategory: 'sakit',
        updatedAt: serverTimestamp(),
      }),
    );
    await assert.rejects(deleteDoc(ownRef));
    await assert.rejects(
      otherAssistant.permissions.decide(id, otherAssistant.profile, 'approved', ''),
    );
    await assert.rejects(student.permissions.decide(id, student.profile, 'approved', ''));
    await assert.rejects(
      student.permissions.decide(
        id,
        {
          ...student.profile,
          role: 'asisten',
        },
        'approved',
        '',
      ),
    );
    await assert.rejects(assistant.permissions.decide(id, assistant.profile, 'rejected', ''));
    await assert.rejects(student.practicum.recordAttendance(sessionId, student.profile.uid));
    let observed;
    const approved = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Real-time decision not received')), 8000);
      stops.push(
        student.permissions.subscribeOne(
          id,
          (item, cached) => {
            observed = item;
            if (item?.status === 'approved' && !cached) {
              clearTimeout(timer);
              resolve();
            }
          },
          reject,
        ),
      );
    });
    await assistant.permissions.decide(
      id,
      assistant.profile,
      'approved',
      'Istirahat dan semoga lekas pulih.',
    );
    await approved;
    assert.equal(observed.decidedBy, assistant.profile.uid);
    assert.ok(observed.decidedAt.toMillis() > 0);
    const restored = await getDoc(doc(student.db, 'permissions', id));
    assert.equal(restored.data().decisionReason, 'Istirahat dan semoga lekas pulih.');
    await assert.rejects(
      assistant.permissions.decide(id, assistant.profile, 'rejected', 'Keputusan diubah.'),
    );
    await assert.rejects(
      updateDoc(doc(assistant.db, 'permissions', id), {
        userId: outsider.profile.uid,
        updatedAt: serverTimestamp(),
      }),
    );
    const recap = await assistant.practicum.listRecap(sessionId);
    assert.equal(
      recap.find((row) => row.participant.userId === student.profile.uid).status,
      'excused',
    );
    const id2 = await student2.permissions.submit(student2.profile, {
      ...input,
      reason: 'Ada acara yang membutuhkan izin asisten.',
    });
    await env.withSecurityRulesDisabled(async (context) => {
      const ref = adminDoc(context.firestore(), 'users', assistant.profile.uid);
      await adminSetDoc(ref, { roles: ['praktikan'] }, { merge: true });
    });
    await assert.rejects(
      assistant.permissions.decide(
        id2,
        assistant.profile,
        'rejected',
        'Akses asisten sudah dicabut.',
      ),
    );
    assert.equal((await getDoc(doc(student2.db, 'permissions', id2))).data().status, 'pending');
    await env.withSecurityRulesDisabled(async (context) => {
      const ref = adminDoc(context.firestore(), 'users', assistant.profile.uid);
      await adminSetDoc(ref, { roles: ['praktikan', 'asisten'] }, { merge: true });
    });
    await assistant.permissions.decide(
      id2,
      assistant.profile,
      'rejected',
      'Alasan belum memenuhi ketentuan kelas.',
    );
    const rejected = await getDoc(doc(student2.db, 'permissions', id2));
    assert.equal(rejected.data().status, 'rejected');
    assert.equal(rejected.data().decisionReason, 'Alasan belum memenuhi ketentuan kelas.');
    await student2.practicum.recordAttendance(sessionId, student2.profile.uid);
    assert.equal(
      (await assistant.practicum.listRecap(sessionId)).find(
        (row) => row.participant.userId === student2.profile.uid,
      ).status,
      'present',
    );
    await assistant.practicum.closeSession(sessionId, assistant.profile.uid);
    assert.equal((await getDoc(ownRef)).data().status, 'approved');
    await assert.rejects(student.permissions.submit(student.profile, input));
    // Reconstructing the repository does not reset persisted Firestore data.
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Restored permission list missing')), 8000);
      stops.push(
        createPermissionRepository(student.db).subscribeList(
          student.profile,
          (items, cached) => {
            if (!cached && items.some((item) => item.id === id && item.status === 'approved')) {
              clearTimeout(timer);
              resolve();
            }
          },
          reject,
        ),
      );
    });
    const raw = {
      ...own,
      status: 'approved',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await assert.rejects(
      setDoc(doc(outsider.db, 'permissions', `${sessionId}_${outsider.profile.uid}`), raw),
    );
  } finally {
    stops.forEach((stop) => stop());
    await Promise.all(apps.map((app) => deleteApp(app)));
    await env.cleanup();
  }
});
