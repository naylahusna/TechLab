import { readFileSync } from 'node:fs';
import process from 'node:process';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, Timestamp } from 'firebase/firestore';

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
const assistantEmail = 'asisten.demo@techlab.test';
const studentEmails = [
  ...Array.from({ length: 10 }, (_, index) => `praktikan${index + 1}.demo@techlab.test`),
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

const at = (iso) => Timestamp.fromDate(new Date(iso));
const CLASS_A = 'class-if-a';
const CLASS_B = 'class-if-b';
const SCHEDULE_A1 = 'schedule-a-1';
const SCHEDULE_A2 = 'schedule-a-2';
const SCHEDULE_B1 = 'schedule-b-1';

const assistantId = await ensureAuthUser(assistantEmail);
const studentIds = [];
for (const email of studentEmails) studentIds.push(await ensureAuthUser(email));
const studentNumbers = studentIds.map((_, index) => `240101${String(index + 1).padStart(3, '0')}`);
const studentNames = studentIds.map((_, index) => `Praktikan Demo ${index + 1}`);
const classAStudents = [...studentIds];
const classBStudents = studentIds.length > 1 ? [...studentIds] : [];

const env = await initializeTestEnvironment({
  projectId,
  firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
});

try {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const now = Timestamp.now();
    const users = [
      { uid: assistantId, name: 'Dimas Aditya', number: 'AS-001', role: 'asisten' },
      ...studentIds.map((uid, index) => ({
        uid,
        name: `Praktikan Demo ${index + 1}`,
        number: studentNumbers[index],
        role: 'praktikan',
      })),
    ];
    await Promise.all(
      users.map((user) =>
        setDoc(doc(db, 'users', user.uid), {
          ...user,
          createdAt: now,
          updatedAt: now,
        }),
      ),
    );

    await Promise.all([
      setDoc(doc(db, 'userDirectory', assistantId), {
        uid: assistantId,
        name: 'Dimas Aditya',
        number: 'AS-001',
        role: 'asisten',
        updatedAt: now,
      }),
      ...studentIds.map((uid, index) =>
        setDoc(doc(db, 'userDirectory', uid), {
          uid,
          name: studentNames[index],
          number: studentNumbers[index],
          role: 'praktikan',
          updatedAt: now,
        }),
      ),
    ]);

    const classes = [
      {
        id: CLASS_A,
        className: 'Informatika A',
        courseName: 'Pemrograman Perangkat Bergerak',
        studentIds: classAStudents,
        createdAt: at('2026-11-01T00:00:00+07:00'),
      },
      {
        id: CLASS_B,
        className: 'Informatika B',
        courseName: 'Basis Data',
        studentIds: classBStudents,
        createdAt: at('2026-11-02T00:00:00+07:00'),
      },
    ];
    await Promise.all(
      classes.map((item) =>
        setDoc(doc(db, 'classes', item.id), {
          className: item.className,
          courseName: item.courseName,
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
      ids.forEach((userId, index) => {
        participantWrites.push(
          setDoc(doc(db, 'participants', `${classId}_${userId}`), {
            classId,
            userId,
            studentName: studentNames[index],
            studentNumber: studentNumbers[index],
            joinedAt,
            leftAt: null,
          }),
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
        location: 'Lab Komputasi 1',
      },
      {
        id: SCHEDULE_A2,
        classId: CLASS_A,
        title: 'Pertemuan 6 — State dan API',
        startAt: at('2026-11-23T08:00:00+07:00'),
        endAt: at('2026-11-23T10:00:00+07:00'),
        location: 'Lab Komputasi 1',
      },
      {
        id: SCHEDULE_B1,
        classId: CLASS_B,
        title: 'Pertemuan 4 — Relasi Data',
        startAt: at('2026-11-17T13:00:00+07:00'),
        endAt: at('2026-11-17T15:00:00+07:00'),
        location: 'Lab Komputasi 2',
      },
    ];
    await Promise.all(
      schedules.map((item) =>
        setDoc(doc(db, 'schedules', item.id), {
          classId: item.classId,
          title: item.title,
          startAt: item.startAt,
          endAt: item.endAt,
          location: item.location,
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
        setDoc(doc(db, 'sessions', item.id), {
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
      setDoc(doc(db, 'attendances', `${SCHEDULE_A1}_${studentIds[0]}`), {
        sessionId: SCHEDULE_A1,
        classId: CLASS_A,
        userId: studentIds[0],
        status: 'present',
        recordedAt: at('2026-11-16T08:05:00+07:00'),
      }),
      setDoc(doc(db, 'attendances', `${SCHEDULE_A2}_${studentIds[0]}`), {
        sessionId: SCHEDULE_A2,
        classId: CLASS_A,
        userId: studentIds[0],
        status: 'present',
        recordedAt: at('2026-11-23T08:03:00+07:00'),
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
        setDoc(doc(db, 'permissions', `${SCHEDULE_A1}_${studentIds[1]}`), {
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
        setDoc(doc(db, 'permissions', `${SCHEDULE_A2}_${studentIds[1]}`), {
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
        setDoc(doc(db, 'permissions', `${SCHEDULE_A1}_${studentIds[2]}`), {
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
      { student: 3, session: SCHEDULE_B1, classId: CLASS_B, scheduleIndex: 2, status: 'pending', aiConsent: true },
      { student: 4, session: SCHEDULE_B1, classId: CLASS_B, scheduleIndex: 2, status: 'approved', aiConsent: false },
      { student: 5, session: SCHEDULE_B1, classId: CLASS_B, scheduleIndex: 2, status: 'rejected', aiConsent: false },
      { student: 6, session: SCHEDULE_A2, classId: CLASS_A, scheduleIndex: 1, status: 'pending', aiConsent: false },
      { student: 7, session: SCHEDULE_A2, classId: CLASS_A, scheduleIndex: 1, status: 'approved', aiConsent: true },
      { student: 8, session: SCHEDULE_A2, classId: CLASS_A, scheduleIndex: 1, status: 'rejected', aiConsent: true },
      { student: 9, session: SCHEDULE_A1, classId: CLASS_A, scheduleIndex: 0, status: 'pending', aiConsent: false },
    ];
    for (const item of additionalPermissions) {
      const decided = item.status !== 'pending';
      const created = at('2026-11-15T18:30:00+07:00');
      permissionWrites.push(setDoc(doc(db, 'permissions', `${item.session}_${studentIds[item.student]}`), {
        sessionId: item.session,
        classId: item.classId,
        userId: studentIds[item.student],
        reason: item.student === 3 ? 'Demam dan perlu beristirahat.' : 'Keperluan keluarga yang perlu ditangani.',
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

    console.log('Seed praktikum selesai:', {
      classIds: classes.map((item) => item.id),
      scheduleIds: schedules.map((item) => item.id),
      sessionIds: sessions.map((item) => item.id),
    });
  });
} finally {
  await env.cleanup();
}

console.log('\nAkun demo (Firebase Auth emulator):');
console.log(`Asisten      : ${assistantEmail} / ${password}`);
studentEmails.forEach((email, index) =>
  console.log(`Praktikan ${index + 1} : ${email} / ${password}`),
);
console.log('\nAktifkan EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true di .env sebelum menjalankan app.');
