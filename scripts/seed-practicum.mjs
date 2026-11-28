import { readFileSync } from 'node:fs';
import process from 'node:process';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, runTransaction, Timestamp } from 'firebase/firestore';

process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';

function assertLoopbackEmulator(host, name) {
  const hostname = new URL(`http://${host}`).hostname;
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(hostname)) {
    throw new Error(`${name} harus menunjuk ke Firebase emulator lokal, bukan layanan produksi.`);
  }
}

assertLoopbackEmulator(process.env.FIRESTORE_EMULATOR_HOST, 'Firestore');
assertLoopbackEmulator(process.env.FIREBASE_AUTH_EMULATOR_HOST, 'Firebase Auth');

const projectId = 'techlab-naylahusna-2026';
const authBase = `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1`;
const apiKey = 'demo-key';
const password = 'TechLab123!';
const adminEmail = 'admin.demo@techlab.test';
const assistantEmail = 'asisten.demo@techlab.test';
const studentEmails = [
  ...Array.from({ length: 13 }, (_, index) => `praktikan${index + 1}.demo@techlab.test`),
];

async function ensureAuthUser(email) {
  const signUp = await fetch(`${authBase}/accounts:signUp?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const signUpBody = await signUp.json();
  if (signUp.ok) return signUpBody.localId;
  if (signUpBody?.error?.message === 'EMAIL_EXISTS') {
    const signIn = await fetch(`${authBase}/accounts:signInWithPassword?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    const signInBody = await signIn.json();
    if (signIn.ok) return signInBody.localId;
    throw new Error(
      `Gagal login akun demo ${email}: ${signInBody?.error?.message ?? signIn.status}`,
    );
  }
  throw new Error(
    `Gagal membuat akun demo ${email}: ${signUpBody?.error?.message ?? signUp.status}`,
  );
}

const originalReference = Date.parse('2026-11-23T08:00:00+07:00');
let reference = originalReference;
const at = (iso) => Timestamp.fromMillis(reference + Date.parse(iso) - originalReference);

async function setDemoDoc(ref, data, rosterRef, userId) {
  await runTransaction(ref.firestore, async (transaction) => {
    if ((await transaction.get(ref)).exists()) return;
    if (rosterRef && !(await transaction.get(rosterRef)).data()?.studentIds?.includes(userId)) return;
    transaction.set(ref, data);
  });
}
const CLASS_A = 's4-class-if-a';
const CLASS_C = 's4-class-if-c';
const CLASS_B = 's4-class-if-b';
const SCHEDULE_A1 = 's4-schedule-a-1';
const SCHEDULE_A2 = 's4-schedule-a-2';
const SCHEDULE_B1 = 's4-schedule-b-1';

const adminId = await ensureAuthUser(adminEmail);
const assistantId = await ensureAuthUser(assistantEmail);
const studentIds = [];
for (const email of studentEmails) studentIds.push(await ensureAuthUser(email));
const studentNumbers = studentIds.map((_, index) => `240101${String(index + 1).padStart(3, '0')}`);
const studentNames = studentIds.map((_, index) => `Praktikan Demo ${index + 1}`);
const classAStudents = studentIds.slice(0, 11);
const classBStudents = studentIds.slice(0, 3);

const env = await initializeTestEnvironment({
  projectId,
  firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
});

try {
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const labLocations = [
      { id: 'lab-informatika-b', name: 'Lab Informatika B', building: 'Gedung E FSM UNDIP', floor: 2, latitude: -7.0482375, longitude: 110.440765625, plusCode: '6P4GXC2R+P82' },
      { id: 'lab-informatika-c', name: 'Lab Informatika C', building: 'Gedung E FSM UNDIP', floor: 2, latitude: -7.0482375, longitude: 110.440765625, plusCode: '6P4GXC2R+P82' },
      { id: 'lab-informatika-d', name: 'Lab Informatika D', building: 'Gedung E FSM UNDIP', floor: 2, latitude: -7.0482375, longitude: 110.440765625, plusCode: '6P4GXC2R+P82' },
      { id: 'dekanat-fsm', name: 'Dekanat FSM UNDIP', building: 'Gedung Dekanat FSM UNDIP', floor: null, latitude: -7.0490375, longitude: 110.441484375, plusCode: '6P4GXC2R+9HQ' },
    ];
    const labLocationSource = 'Google Maps business listing Plus Codes, converted to grid cell centers; UNDIP UTBK 2026 for lab floor';
    const labLocationCaution = 'Building-level map reference points only; NOT independently surveyed room coordinates and NOT adequate to distinguish nearby labs with GPS geofencing.';
    const users = [
      { uid: adminId, name: 'Admin Lab Demo', number: 'ADM-001', role: 'admin' },
      { uid: assistantId, name: 'Dimas Aditya', number: 'AS-001', role: 'asisten' },
      ...studentIds.map((uid, index) => ({
        uid,
        name: `Praktikan Demo ${index + 1}`,
        number: studentNumbers[index],
        role: 'praktikan',
      })),
    ];
    for (const user of users) {
      const profile = (await getDoc(doc(db, 'users', user.uid))).data();
      if (profile && (profile.uid !== user.uid || profile.role !== user.role || profile.number !== user.number)) {
        throw new Error(`Profil akun demo bentrok untuk ${user.number}. Gunakan basis uji terpisah.`);
      }
    }

    const clock = doc(db, 'demoFixtures', 'sprint-4-basic');
    reference = await runTransaction(db, async (transaction) => {
      const old = (await transaction.get(clock)).data();
      if (typeof old?.referenceMs === 'number' && Number.isFinite(old.referenceMs)) return old.referenceMs;
      const referenceMs = Date.now() - 10 * 60 * 1000;
      transaction.set(clock, { referenceMs });
      return referenceMs;
    });
    const now = Timestamp.fromMillis(reference);
    await Promise.all(
      users.map((user) =>
        setDemoDoc(doc(db, 'users', user.uid), {
          ...user,
          createdAt: now,
          updatedAt: now,
        }),
      ),
    );

    await setDemoDoc(doc(db, 'aslabScopes', adminId), {
      courseNames: ['Pemrograman Perangkat Bergerak', 'Basis Data'],
    });

    const courseLabs = [
      { courseName: 'Pemrograman Perangkat Bergerak', labIds: ['lab-informatika-b', 'lab-informatika-c'], graceMinutes: 10 },
      { courseName: 'Basis Data', labIds: ['lab-informatika-b', 'lab-informatika-d'], graceMinutes: 5 },
    ];
    await Promise.all(courseLabs.map((course) =>
      setDemoDoc(doc(db, 'courseLabSettings', 'course-' + course.courseName), { ...course, updatedAt: now }),
    ));
    await Promise.all(labLocations.map((item) => setDemoDoc(doc(db, 'labLocations', item.id), {
      name: item.name,
      catalogVersion: 2,
      latitude: item.latitude,
      longitude: item.longitude,
      radiusMeters: 100,
      building: item.building,
      floor: item.floor,
      plusCode: item.plusCode,
      pointType: 'building_map_reference',
      roomCenterVerified: false,
      source: labLocationSource,
      caution: labLocationCaution,
      createdAt: now,
      updatedAt: now,
      updatedBy: assistantId,
    })));

    await Promise.all(labLocations.map((item) => setDemoDoc(doc(db, 'labManagers', item.id), {
      courseName: ['lab-informatika-b', 'lab-informatika-c'].includes(item.id) ? 'Pemrograman Perangkat Bergerak' : 'Basis Data',
    })));

    await Promise.all(users.map((user) =>
      setDemoDoc(doc(db, 'userDirectory', user.uid), { ...user, updatedAt: now }),
    ));

    const classes = [
      {
        id: CLASS_A,
        className: 'Informatika A Sprint 4',
        labId: 'lab-informatika-b',
        courseName: 'Pemrograman Perangkat Bergerak',
        studentIds: classAStudents,
        createdAt: at('2026-11-01T00:00:00+07:00'),
      },
      {
        id: CLASS_B,
        className: 'Informatika B Sprint 4',
        labId: 'lab-informatika-d',
        courseName: 'Basis Data',
        studentIds: classBStudents,
        createdAt: at('2026-11-02T00:00:00+07:00'),
      },
      {
        id: CLASS_C, className: 'Informatika C Sprint 4', courseName: 'Pemrograman Perangkat Bergerak',
        labId: 'lab-informatika-c', studentIds: [], createdAt: at('2026-11-01T00:00:00+07:00'),
      },
    ];
    await Promise.all(
      classes.map((item) =>
        setDemoDoc(doc(db, 'classes', item.id), {
          className: item.className,
          courseName: item.courseName,
          courseId: 'course-' + item.courseName,
          labId: item.labId,
          assistantIds: [assistantId],
          studentIds: item.studentIds,
          memberIds: [assistantId, ...item.studentIds],
          createdAt: item.createdAt,
          updatedAt: item.createdAt,
          archivedAt: null,
        }),
      ),
    );

    const joinedAt = at('2026-11-01T00:00:00+07:00');
    const participantWrites = [];
    for (const classId of [CLASS_A, CLASS_B]) {
      const ids = classId === CLASS_A ? classAStudents : classBStudents;
      ids.forEach((userId) => {
        const index = studentIds.indexOf(userId);
        participantWrites.push(
          setDemoDoc(doc(db, 'participants', `${classId}_${userId}`), {
            classId,
            userId,
            studentName: studentNames[index],
            studentNumber: studentNumbers[index],
            joinedAt,
            leftAt: null,
          }, doc(db, 'classes', classId), userId),
        );
      });
    }
    await Promise.all(participantWrites);

    const schedules = [
      {
        id: SCHEDULE_A1,
        classId: CLASS_A,
        title: 'Pertemuan 5 — UI dan Navigasi',
        startAt: at('2026-11-16T08:00:00+07:00'),
        endAt: at('2026-11-16T10:00:00+07:00'),
        location: 'Lab Informatika B', labId: 'lab-informatika-b',
      },
      {
        id: SCHEDULE_A2,
        classId: CLASS_A,
        title: 'Pertemuan 6 — State dan API',
        startAt: at('2026-11-23T08:00:00+07:00'),
        endAt: at('2026-11-23T10:00:00+07:00'),
        location: 'Lab Informatika C', labId: 'lab-informatika-c',
      },
      {
        id: SCHEDULE_B1,
        classId: CLASS_B,
        title: 'Pertemuan 4 — Relasi Data',
        startAt: at('2026-11-24T08:00:00+07:00'),
        endAt: at('2026-11-24T10:00:00+07:00'),
        location: 'Lab Informatika D', labId: 'lab-informatika-d',
      },
    ];
    await Promise.all(
      schedules.map((item) =>
        setDemoDoc(doc(db, 'schedules', item.id), {
          classId: item.classId,
          title: item.title,
          startAt: item.startAt,
          endAt: item.endAt,
          location: item.location,
          labId: item.labId,
          createdAt: joinedAt,
          updatedAt: joinedAt,
          archivedAt: null,
        }),
      ),
    );

    const sessions = [
      {
        id: SCHEDULE_A1,
        scheduleId: SCHEDULE_A1,
        classId: CLASS_A,
        studentIds: classAStudents,
        startAt: schedules[0].startAt,
        endAt: schedules[0].endAt,
        status: 'closed',
        openedAt: at('2026-11-16T07:55:00+07:00'),
        closedAt: at('2026-11-16T10:05:00+07:00'),
        cancelledAt: null,
        openedBy: assistantId,
        closedBy: assistantId,
        cancelledBy: null,
      },
      {
        id: SCHEDULE_A2,
        scheduleId: SCHEDULE_A2,
        classId: CLASS_A,
        studentIds: classAStudents,
        startAt: schedules[1].startAt,
        endAt: schedules[1].endAt,
        status: 'open',
        openedAt: at('2026-11-23T07:55:00+07:00'),
        closedAt: null,
        cancelledAt: null,
        openedBy: assistantId,
        closedBy: null,
        cancelledBy: null,
      },
      {
        id: SCHEDULE_B1,
        scheduleId: SCHEDULE_B1,
        classId: CLASS_B,
        studentIds: classBStudents,
        startAt: schedules[2].startAt,
        endAt: schedules[2].endAt,
        status: 'scheduled',
        openedAt: null,
        closedAt: null,
        cancelledAt: null,
        openedBy: null,
        closedBy: null,
        cancelledBy: null,
      },
    ];
    await Promise.all(
      sessions.map((item) =>
        setDemoDoc(doc(db, 'sessions', item.id), {
          scheduleId: item.scheduleId,
          classId: item.classId,
          studentIds: item.studentIds,
          startAt: item.startAt,
          endAt: item.endAt,
          status: item.status,
          openedAt: item.openedAt,
          closedAt: item.closedAt,
          cancelledAt: item.cancelledAt,
          openedBy: item.openedBy,
          closedBy: item.closedBy,
          cancelledBy: item.cancelledBy,
          createdBy: assistantId,
          createdAt: joinedAt,
          updatedAt: joinedAt,
        }),
      ),
    );

    await Promise.all([
      setDemoDoc(doc(db, 'attendances', `${SCHEDULE_A1}_${studentIds[0]}`), {
        sessionId: SCHEDULE_A1,
        classId: CLASS_A,
        userId: studentIds[0],
        status: 'present',
        recordedAt: at('2026-11-16T08:05:00+07:00'),
        latitude: -7.0482375,
        longitude: 110.440765625,
        accuracyMeters: 10,
        distanceMeters: 5,
        allowedRadiusMeters: 100,
        locationValidated: true,
        labName: 'Lab Informatika B',
      }),
      setDemoDoc(doc(db, 'attendances', `${SCHEDULE_A2}_${studentIds[0]}`), {
        sessionId: SCHEDULE_A2,
        classId: CLASS_A,
        userId: studentIds[0],
        status: 'present',
        recordedAt: at('2026-11-23T08:03:00+07:00'),
        latitude: -7.0482375,
        longitude: 110.440765625,
        accuracyMeters: 10,
        distanceMeters: 5,
        allowedRadiusMeters: 100,
        locationValidated: true,
        labName: 'Lab Informatika C',
      }),
    ]);

    const permissionFields = (student, schedule) => ({
      kind: 'lainnya',
      studentName: studentNames[student],
      studentNumber: studentNumbers[student],
      className: 'Informatika A',
      sessionTitle: schedules[schedule].title,
      sessionStartAt: schedules[schedule].startAt,
      decisionReason: schedule === 1 ? 'Kegiatan tidak memenuhi ketentuan izin kelas.' : null,
      aiConsent: false,
      aiSource: null,
      aiClassifiedAt: null,
      aiError: 'Data contoh seed. Klasifikasi AI belum diaktifkan.',
      aiCategory: null,
      aiConfidence: null,
      aiStatus: 'unavailable',
    });
    const permissionWrites = [];
    if (studentIds[1]) {
      permissionWrites.push(
        setDemoDoc(doc(db, 'permissions', `${SCHEDULE_A1}_${studentIds[1]}`), {
          sessionId: SCHEDULE_A1,
          classId: CLASS_A,
          userId: studentIds[1],
          reason: 'Sakit demam sejak pagi.',
          ...permissionFields(1, 0),
          status: 'approved',
          decidedBy: assistantId,
          decidedAt: at('2026-11-15T19:00:00+07:00'),
          createdAt: at('2026-11-15T18:30:00+07:00'),
          updatedAt: at('2026-11-15T19:00:00+07:00'),
        }),
        setDemoDoc(doc(db, 'permissions', `${SCHEDULE_A2}_${studentIds[1]}`), {
          sessionId: SCHEDULE_A2,
          classId: CLASS_A,
          userId: studentIds[1],
          reason: 'Mengikuti kegiatan organisasi kampus.',
          ...permissionFields(1, 1),
          status: 'rejected',
          decidedBy: assistantId,
          decidedAt: at('2026-11-22T19:00:00+07:00'),
          createdAt: at('2026-11-22T18:30:00+07:00'),
          updatedAt: at('2026-11-22T19:00:00+07:00'),
        }),
      );
    }
    if (studentIds[2]) {
      permissionWrites.push(
        setDemoDoc(doc(db, 'permissions', `${SCHEDULE_A1}_${studentIds[2]}`), {
          sessionId: SCHEDULE_A1,
          classId: CLASS_A,
          userId: studentIds[2],
          reason: 'Ada urusan keluarga di luar kota.',
          ...permissionFields(2, 0),
          status: 'pending',
          decidedBy: null,
          decidedAt: null,
          createdAt: at('2026-11-15T20:00:00+07:00'),
          updatedAt: at('2026-11-15T20:00:00+07:00'),
        }),
      );
    }
    // Extra praktikan provide independent identities for manual edge-case testing:
    // no attendance/permission, plus multiple permission states on each session status.
    const additionalPermissions = [
      { student: 0, session: SCHEDULE_B1, classId: CLASS_B, scheduleIndex: 2, status: 'pending', aiConsent: true },
      { student: 1, session: SCHEDULE_B1, classId: CLASS_B, scheduleIndex: 2, status: 'approved', aiConsent: false },
      { student: 2, session: SCHEDULE_B1, classId: CLASS_B, scheduleIndex: 2, status: 'rejected', aiConsent: false },
      { student: 6, session: SCHEDULE_A2, classId: CLASS_A, scheduleIndex: 1, status: 'pending', aiConsent: false },
      { student: 7, session: SCHEDULE_A2, classId: CLASS_A, scheduleIndex: 1, status: 'approved', aiConsent: true },
      { student: 8, session: SCHEDULE_A2, classId: CLASS_A, scheduleIndex: 1, status: 'rejected', aiConsent: true },
      { student: 9, session: SCHEDULE_A1, classId: CLASS_A, scheduleIndex: 0, status: 'pending', aiConsent: false },
    ];
    for (const item of additionalPermissions) {
      const decided = item.status !== 'pending';
      const created = at('2026-11-15T18:30:00+07:00');
      permissionWrites.push(setDemoDoc(doc(db, 'permissions', `${item.session}_${studentIds[item.student]}`), {
        sessionId: item.session,
        classId: item.classId,
        userId: studentIds[item.student],
        reason: item.session === SCHEDULE_B1 && item.student === 0 ? 'Demam dan perlu beristirahat.' : 'Keperluan keluarga yang perlu ditangani.',
        ...permissionFields(item.student, item.scheduleIndex),
        className: item.classId === CLASS_B ? 'Informatika B' : 'Informatika A',
        aiConsent: item.aiConsent,
        aiError: item.aiConsent ? 'Seed uji: klasifikasi belum dijalankan.' : 'Pemohon tidak memilih analisis AI.',
        status: item.status,
        decidedBy: decided ? assistantId : null,
        decidedAt: decided ? at('2026-11-15T19:00:00+07:00') : null,
        decisionReason: item.status === 'rejected' ? 'Silakan lengkapi bukti atau hubungi asisten.' : null,
        createdAt: created,
        updatedAt: decided ? at('2026-11-15T19:00:00+07:00') : created,
      }));
    }
    await Promise.all(permissionWrites);

    const storedRoster = (await getDoc(doc(db, 'classes', CLASS_A))).data()?.studentIds ?? [];
    const activePractitioners = classAStudents.filter((uid) => storedRoster.includes(uid)).length;
    if (activePractitioners < classAStudents.length) {
      console.warn('Roster yang sudah ada dipertahankan. Gunakan basis uji kosong untuk demo 11 Praktikan aktif.');
    }

    console.log('Seed praktikum selesai:', {
      classIds: classes.map((item) => item.id),
      scheduleIds: schedules.map((item) => item.id),
      sessionIds: sessions.map((item) => item.id),
      labLocationIds: labLocations.map((item) => item.id),
      activePractitioners,
      lateJoinAccounts: studentEmails.slice(11),
    });
  });
} finally {
  await env.cleanup();
}

console.log('\nAkun demo (Firebase Auth emulator):');
console.log(`Admin Lab    : ${adminEmail} / ${password}`);
console.log(`Asisten      : ${assistantEmail} / ${password}`);
studentEmails.forEach((email, index) =>
  console.log(`Praktikan ${index + 1} : ${email} / ${password}`),
);
console.log('\nAktifkan EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true di .env sebelum menjalankan app.');
