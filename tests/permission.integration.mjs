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
    const scheduleId = await assistant.practicum.createSchedule({
      classId,
      title: 'Sesi Integrasi Izin',
      startAt: new Date(Date.now() - 10 * 60_000),
      endAt: new Date(Date.now() + 110 * 60_000),
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
    for (const reason of ['', '   ', 'x', 'x'.repeat(2001)]) {
      await assert.rejects(() => student.permissions.submit(student.profile, { ...input, reason }));
    }
    assert.equal((await getDoc(doc(student.db, 'permissions', `${sessionId}_${student.profile.uid}`))).exists(), false);
    const outcomes = await Promise.allSettled([
      student.permissions.submit({ ...student.profile, name: 'Nama palsu', number: 'PALSU' }, input),
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
    assert.equal(own.studentName, student.profile.name);
    assert.equal(own.decidedBy, null);
    assert.equal(own.decidedAt, null);
    assert.equal(own.decisionReason, null);
    const privateList = await getDocs(
      query(collection(student.db, 'permissions'), where('userId', '==', student.profile.uid)),
    );
    assert.equal(privateList.size, 1);
    const assignedList = await getDocs(query(collection(assistant.db, 'permissions'), where('classId', '==', classId)));
    assert.equal(assignedList.size, 1);
    await assert.rejects(getDocs(query(collection(otherAssistant.db, 'permissions'), where('classId', '==', classId))));
    await assert.rejects(getDoc(doc(otherAssistant.db, 'permissions', id)));
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
    const decisions = await Promise.allSettled([
      assistant.permissions.decide(id, assistant.profile, 'approved', 'Istirahat dan semoga lekas pulih.'),
      assistant.permissions.decide(id, assistant.profile, 'approved', 'Istirahat dan semoga lekas pulih.'),
    ]);
    assert.equal(decisions.filter((result) => result.status === 'fulfilled').length, 1);
    assert.equal(decisions.filter((result) => result.status === 'rejected').length, 1);
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
    await assistant.permissions.decide(
      id2,
      assistant.profile,
      'rejected',
      'Alasan belum memenuhi ketentuan kelas.',
    );
    const rejected = await getDoc(doc(student2.db, 'permissions', id2));
    assert.equal(rejected.data().status, 'rejected');
    assert.equal(rejected.data().decisionReason, 'Alasan belum memenuhi ketentuan kelas.');
    // SRS-17: personal lists contain no records from the other practitioner.
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Personal status list missing')), 8000);
      stops.push(student2.permissions.subscribeList(student2.profile, (items, cached) => {
        if (!cached && items.some((item) => item.id === id2 && item.status === 'rejected')) {
          try {
            assert.ok(items.every((item) => item.userId === student2.profile.uid));
            assert.ok(items.every((item) => item.id !== id));
            clearTimeout(timer); resolve();
          } catch (error) { clearTimeout(timer); reject(error); }
        }
      }, reject));
    });
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

    // SRS-13: a future session accepts a valid submission without marking attendance.
    const scheduledId = await assistant.practicum.createSchedule({
      classId,
      title: 'Sesi Pengajuan Mendatang',
      startAt: new Date('2026-12-02T08:00:00+07:00'),
      endAt: new Date('2026-12-02T10:00:00+07:00'),
      location: 'Lab 1',
    });
    const scheduledSessionId = await assistant.practicum.createSessionFromSchedule(
      scheduledId, assistant.profile.uid,
    );
    const submittedId = await student2.permissions.submit(student2.profile, {
      ...input,
      sessionId: scheduledSessionId,
      reason: '  Ada keperluan keluarga yang tidak dapat ditinggalkan.  ',
      kind: 'keluarga',
      aiConsent: true,
    });
    const submitted = (await getDoc(doc(student2.db, 'permissions', submittedId))).data();
    assert.equal(submitted.reason, 'Ada keperluan keluarga yang tidak dapat ditinggalkan.');
    assert.equal(submitted.kind, 'keluarga');
    assert.equal(submitted.status, 'pending');
    assert.equal(submitted.decidedBy, null);
    assert.equal(submitted.decidedAt, null);
    assert.equal((await getDoc(doc(student2.db, 'attendances', submittedId))).exists(), false);
    const restoredSubmission = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Pending submission missing')), 8000);
      stops.push(createPermissionRepository(student2.db).subscribeOne(submittedId, (item, cached) => {
        if (item && !cached) { clearTimeout(timer); resolve(item); }
      }, reject));
    });
    assert.equal(restoredSubmission.reason, submitted.reason);
    assert.equal(restoredSubmission.status, 'pending');
    await assert.rejects(student.permissions.beginClassification(id, student.profile));
    await assert.rejects(outsider.permissions.beginClassification(submittedId, outsider.profile));
    const claims = await Promise.all([
      student2.permissions.beginClassification(submittedId, student2.profile),
      student2.permissions.beginClassification(submittedId, student2.profile),
    ]);
    assert.equal(claims.filter(Boolean).length, 1);
    const aiResult = {
      aiStatus: 'completed', aiCategory: 'keluarga', aiConfidence: null,
      aiSource: 'https://teacher.example/v1/chat/completions#integration-test', aiError: null,
    };
    await assert.rejects(student2.permissions.saveClassification(submittedId, student2.profile, {
      ...aiResult, aiConfidence: 0.9,
    }));
    await assert.rejects(student2.permissions.saveClassification(submittedId, student2.profile, {
      ...aiResult, aiCategory: 'positif',
    }));
    await student2.permissions.saveClassification(submittedId, student2.profile, aiResult);
    const classified = (await getDoc(doc(student2.db, 'permissions', submittedId))).data();
    assert.equal(classified.aiCategory, 'keluarga');
    assert.equal(classified.aiConfidence, null);
    assert.ok(classified.aiClassifiedAt.toMillis() > 0);
    assert.equal(classified.status, 'pending');
    assert.equal(classified.decidedBy, null);

    // Both the repository and rules reject a stale form after a schedule is archived.
    await assistant.practicum.archiveSchedule(scheduledId);
    await assert.rejects(
      student.permissions.submit(student.profile, { ...input, sessionId: scheduledSessionId }),
      /Kelas atau jadwal tidak lagi tersedia/,
    );
    const archivedRef = doc(student.db, 'permissions', `${scheduledSessionId}_${student.profile.uid}`);
    await assert.rejects(setDoc(archivedRef, {
      ...submitted,
      userId: student.profile.uid,
      studentName: student.profile.name,
      studentNumber: student.profile.number,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
    assert.equal((await getDoc(archivedRef)).exists(), false);

    // An AI failure persists without removing the submission; a retry cannot alter a human decision.
    const raceSchedule = await assistant.practicum.createSchedule({
      classId, title: 'Sesi Uji AI', location: 'Lab 1',
      startAt: new Date('2026-12-03T08:00:00+07:00'),
      endAt: new Date('2026-12-03T10:00:00+07:00'),
    });
    const raceSession = await assistant.practicum.createSessionFromSchedule(raceSchedule, assistant.profile.uid);
    const raceId = await student.permissions.submit(student.profile, {
      ...input, sessionId: raceSession, aiConsent: true,
    });
    await student.permissions.beginClassification(raceId, student.profile);
    await student.permissions.saveClassification(raceId, student.profile, {
      aiStatus: 'failed', aiCategory: null, aiConfidence: null,
      aiSource: null, aiError: 'Layanan tidak merespons. Tinjau manual.',
    });
    const failed = (await getDoc(doc(student.db, 'permissions', raceId))).data();
    assert.equal(failed.status, 'pending'); assert.equal(failed.reason, input.reason);
    assert.equal(failed.aiStatus, 'failed');
    assert.equal(await student.permissions.beginClassification(raceId, student.profile), true);
    await assistant.permissions.decide(raceId, assistant.profile, 'approved', 'Keputusan manusia.');
    await student.permissions.saveClassification(raceId, student.profile, { ...aiResult, aiCategory: 'sakit' });
    const finished = (await getDoc(doc(student.db, 'permissions', raceId))).data();
    assert.equal(finished.status, 'approved'); assert.equal(finished.decidedBy, assistant.profile.uid);
    assert.equal(finished.decisionReason, 'Keputusan manusia.'); assert.equal(finished.aiStatus, 'completed');
    await assert.rejects(student.permissions.saveClassification(raceId, student.profile, aiResult));
    await assert.rejects(updateDoc(doc(student.db, 'permissions', raceId), {
      status: 'rejected', aiCategory: 'keluarga', aiClassifiedAt: serverTimestamp(), updatedAt: serverTimestamp(),
    }));
  } finally {
    stops.forEach((stop) => stop());
    await Promise.all(apps.map((app) => deleteApp(app)));
    await env.cleanup();
  }
});
