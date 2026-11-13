import { readFileSync } from 'node:fs';
import process from 'node:process';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, Timestamp } from 'firebase/firestore';

if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  throw new Error('Jalankan seed lewat Firebase emulator (auth + firestore).');
}

const projectId = 'techlab-naylahusna-2026';
const authBase = `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1`;
const apiKey = 'demo-key';
const password = 'TechLab123!';
const assistantEmail = 'asisten.demo@techlab.test';
const studentEmails = [
  'praktikan1.demo@techlab.test',
  'praktikan2.demo@techlab.test',
  'praktikan3.demo@techlab.test',
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
    throw new Error(`Gagal login akun demo ${email}: ${signInBody?.error?.message ?? signIn.status}`);
  }
  throw new Error(`Gagal membuat akun demo ${email}: ${signUpBody?.error?.message ?? signUp.status}`);
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
const studentNumbers = studentIds.map((_, index) => `24010100${index + 1}`);
const studentNames = studentIds.map((_, index) => `Praktikan Demo ${index + 1}`);
const classAStudents = [...studentIds];
const classBStudents = studentIds.length > 1 ? studentIds.slice(0, 2) : [];

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

    const permissionWrites = [];
    if (studentIds[1]) {
      permissionWrites.push(
        setDoc(doc(db, 'permissions', `permission-${SCHEDULE_A1}-${studentIds[1]}`), {
          sessionId: SCHEDULE_A1,
          classId: CLASS_A,
          userId: studentIds[1],
          reason: 'Sakit demam sejak pagi.',
          aiCategory: 'sakit',
          aiConfidence: 0.92,
          aiStatus: 'completed',
          status: 'approved',
          decidedBy: assistantId,
          decidedAt: at('2026-11-15T19:00:00+07:00'),
          createdAt: at('2026-11-15T18:30:00+07:00'),
          updatedAt: at('2026-11-15T19:00:00+07:00'),
        }),
        setDoc(doc(db, 'permissions', `permission-${SCHEDULE_A2}-${studentIds[1]}`), {
          sessionId: SCHEDULE_A2,
          classId: CLASS_A,
          userId: studentIds[1],
          reason: 'Mengikuti kegiatan organisasi kampus.',
          aiCategory: 'kegiatan kampus',
          aiConfidence: 0.74,
          aiStatus: 'completed',
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
        setDoc(doc(db, 'permissions', `permission-${SCHEDULE_A1}-${studentIds[2]}`), {
          sessionId: SCHEDULE_A1,
          classId: CLASS_A,
          userId: studentIds[2],
          reason: 'Ada urusan keluarga di luar kota.',
          aiCategory: 'keluarga',
          aiConfidence: 0.81,
          aiStatus: 'completed',
          status: 'pending',
          decidedBy: null,
          decidedAt: null,
          createdAt: at('2026-11-15T20:00:00+07:00'),
          updatedAt: at('2026-11-15T20:00:00+07:00'),
        }),
      );
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
