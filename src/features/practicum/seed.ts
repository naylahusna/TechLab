import { doc, setDoc, Timestamp, type Firestore } from 'firebase/firestore';
import {
  attendanceId,
  participantId,
  PRACTICUM_COLLECTIONS,
  sessionIdForSchedule,
} from './ids';

export type SeedPracticumOptions = Readonly<{
  assistantId: string;
  assistantName?: string;
  studentIds: readonly string[];
  studentNames?: readonly string[];
  studentNumbers?: readonly string[];
}>;

export type SeedPracticumResult = Readonly<{
  classIds: readonly string[];
  scheduleIds: readonly string[];
  sessionIds: readonly string[];
}>;

const CLASS_A = 'class-if-a';
const CLASS_B = 'class-if-b';
const SCHEDULE_A1 = 'schedule-a-1';
const SCHEDULE_A2 = 'schedule-a-2';
const SCHEDULE_B1 = 'schedule-b-1';

function at(iso: string): Timestamp {
  return Timestamp.fromDate(new Date(iso));
}

function studentNumberFor(index: number): string {
  return `240101${String(index + 1).padStart(3, '0')}`;
}

function studentNameFor(index: number): string {
  return `Praktikan Demo ${index + 1}`;
}

/**
 * Seed data praktikum untuk emulator/demo.
 *
 * Satu jadwal = satu sesi, sehingga sessionId sama dengan scheduleId.
 * Fungsi ini tidak menghapus data lama; pemanggil (script emulator) harus
 * membersihkan Firestore terlebih dahulu.
 */
export async function seedPracticumData(
  db: Firestore,
  options: SeedPracticumOptions,
): Promise<SeedPracticumResult> {
  if (!options.assistantId) throw new Error('assistantId wajib diisi.');
  if (options.studentIds.length === 0)
    throw new Error('Minimal satu studentId diperlukan untuk seed.');

  const createdAt = at('2026-11-01T00:00:00+07:00');
  const joinedAt = at('2026-11-01T00:00:00+07:00');
  const classACreatedAt = createdAt;
  const classBCreatedAt = at('2026-11-02T00:00:00+07:00');

  const classAStudentIds = [...options.studentIds];
  const classBStudentIds =
    options.studentIds.length > 1 ? options.studentIds.slice(0, 2) : [];

  const classes = [
    {
      id: CLASS_A,
      className: 'Informatika A',
      courseName: 'Pemrograman Perangkat Bergerak',
      assistantIds: [options.assistantId],
      studentIds: classAStudentIds,
      memberIds: [options.assistantId, ...classAStudentIds],
      createdAt: classACreatedAt,
    },
    {
      id: CLASS_B,
      className: 'Informatika B',
      courseName: 'Basis Data',
      assistantIds: [options.assistantId],
      studentIds: classBStudentIds,
      memberIds: [options.assistantId, ...classBStudentIds],
      createdAt: classBCreatedAt,
    },
  ];

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

  const sessions = [
    {
      id: sessionIdForSchedule(SCHEDULE_A1),
      scheduleId: SCHEDULE_A1,
      classId: CLASS_A,
      studentIds: classAStudentIds,
      startAt: schedules[0].startAt,
      endAt: schedules[0].endAt,
      status: 'closed' as const,
      openedAt: at('2026-11-16T07:55:00+07:00'),
      closedAt: at('2026-11-16T10:05:00+07:00'),
      cancelledAt: null,
    },
    {
      id: sessionIdForSchedule(SCHEDULE_A2),
      scheduleId: SCHEDULE_A2,
      classId: CLASS_A,
      studentIds: classAStudentIds,
      startAt: schedules[1].startAt,
      endAt: schedules[1].endAt,
      status: 'open' as const,
      openedAt: at('2026-11-23T07:55:00+07:00'),
      closedAt: null,
      cancelledAt: null,
    },
    {
      id: sessionIdForSchedule(SCHEDULE_B1),
      scheduleId: SCHEDULE_B1,
      classId: CLASS_B,
      studentIds: classBStudentIds,
      startAt: schedules[2].startAt,
      endAt: schedules[2].endAt,
      status: 'scheduled' as const,
      openedAt: null,
      closedAt: null,
      cancelledAt: null,
    },
  ];

  await Promise.all([
    setDoc(doc(db, PRACTICUM_COLLECTIONS.userDirectory, options.assistantId), {
      uid: options.assistantId,
      name: options.assistantName ?? 'Asisten Demo',
      number: 'AS-001',
      role: 'asisten',
      updatedAt: joinedAt,
    }),
    ...options.studentIds.map((uid, index) =>
      setDoc(doc(db, PRACTICUM_COLLECTIONS.userDirectory, uid), {
        uid,
        name: options.studentNames?.[index] ?? studentNameFor(index),
        number: options.studentNumbers?.[index] ?? studentNumberFor(index),
        role: 'praktikan',
        updatedAt: joinedAt,
      }),
    ),
  ]);

  await Promise.all(
    classes.map((item) =>
      setDoc(doc(db, PRACTICUM_COLLECTIONS.classes, item.id), {
        className: item.className,
        courseName: item.courseName,
        assistantIds: item.assistantIds,
        studentIds: item.studentIds,
        memberIds: item.memberIds,
        createdAt: item.createdAt,
        updatedAt: item.createdAt,
        archivedAt: null,
      }),
    ),
  );

  const participantClassIds = [
    CLASS_A,
    ...(options.studentIds.length > 1 ? [CLASS_B] : []),
  ];
  const participantWrites: Promise<void>[] = [];
  for (const classId of participantClassIds) {
    const ids = classId === CLASS_A ? options.studentIds : options.studentIds.slice(0, 2);
    ids.forEach((userId, index) => {
      participantWrites.push(
        setDoc(doc(db, PRACTICUM_COLLECTIONS.participants, participantId(classId, userId)), {
          classId,
          userId,
          studentName: options.studentNames?.[index] ?? studentNameFor(index),
          studentNumber: options.studentNumbers?.[index] ?? studentNumberFor(index),
          joinedAt,
          leftAt: null,
        }),
      );
    });
  }
  await Promise.all(participantWrites);

  await Promise.all(
    schedules.map((item) =>
      setDoc(doc(db, PRACTICUM_COLLECTIONS.schedules, item.id), {
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

  await Promise.all(
    sessions.map((item) =>
      setDoc(doc(db, PRACTICUM_COLLECTIONS.sessions, item.id), {
        scheduleId: item.scheduleId,
        classId: item.classId,
        studentIds: item.studentIds,
        startAt: item.startAt,
        endAt: item.endAt,
        status: item.status,
        openedAt: item.openedAt,
        closedAt: item.closedAt,
        cancelledAt: item.cancelledAt,
        createdBy: options.assistantId,
        createdAt: joinedAt,
        updatedAt: joinedAt,
      }),
    ),
  );

  const firstStudent = options.studentIds[0];
  await Promise.all([
    setDoc(
      doc(db, PRACTICUM_COLLECTIONS.attendances, attendanceId(SCHEDULE_A1, firstStudent)),
      {
        sessionId: SCHEDULE_A1,
        classId: CLASS_A,
        userId: firstStudent,
        status: 'present',
        recordedAt: at('2026-11-16T08:05:00+07:00'),
      },
    ),
    setDoc(
      doc(db, PRACTICUM_COLLECTIONS.attendances, attendanceId(SCHEDULE_A2, firstStudent)),
      {
        sessionId: SCHEDULE_A2,
        classId: CLASS_A,
        userId: firstStudent,
        status: 'present',
        recordedAt: at('2026-11-23T08:03:00+07:00'),
      },
    ),
  ]);

  const permissionWrites: Promise<void>[] = [];
  const secondStudent = options.studentIds[1];
  const thirdStudent = options.studentIds[2];
  if (secondStudent) {
    permissionWrites.push(
      setDoc(
        doc(
          db,
          PRACTICUM_COLLECTIONS.permissions,
          `permission-${SCHEDULE_A1}-${secondStudent}`,
        ),
        {
          sessionId: SCHEDULE_A1,
          classId: CLASS_A,
          userId: secondStudent,
          reason: 'Sakit demam sejak pagi.',
          aiCategory: 'sakit',
          aiConfidence: 0.92,
          aiStatus: 'completed',
          status: 'approved',
          decidedBy: options.assistantId,
          decidedAt: at('2026-11-15T19:00:00+07:00'),
          createdAt: at('2026-11-15T18:30:00+07:00'),
          updatedAt: at('2026-11-15T19:00:00+07:00'),
        },
      ),
      setDoc(
        doc(
          db,
          PRACTICUM_COLLECTIONS.permissions,
          `permission-${SCHEDULE_A2}-${secondStudent}`,
        ),
        {
          sessionId: SCHEDULE_A2,
          classId: CLASS_A,
          userId: secondStudent,
          reason: 'Mengikuti kegiatan organisasi kampus.',
          aiCategory: 'kegiatan kampus',
          aiConfidence: 0.74,
          aiStatus: 'completed',
          status: 'rejected',
          decidedBy: options.assistantId,
          decidedAt: at('2026-11-22T19:00:00+07:00'),
          createdAt: at('2026-11-22T18:30:00+07:00'),
          updatedAt: at('2026-11-22T19:00:00+07:00'),
        },
      ),
    );
  }
  if (thirdStudent) {
    permissionWrites.push(
      setDoc(
        doc(
          db,
          PRACTICUM_COLLECTIONS.permissions,
          `permission-${SCHEDULE_A1}-${thirdStudent}`,
        ),
        {
          sessionId: SCHEDULE_A1,
          classId: CLASS_A,
          userId: thirdStudent,
          reason: 'Ada urusan keluarga di luar kota.',
          aiCategory: 'keluarga',
          aiConfidence: 0.81,
          aiStatus: 'completed',
          status: 'pending',
          decidedBy: null,
          decidedAt: null,
          createdAt: at('2026-11-15T20:00:00+07:00'),
          updatedAt: at('2026-11-15T20:00:00+07:00'),
        },
      ),
    );
  }
  await Promise.all(permissionWrites);

  return {
    classIds: classes.map((item) => item.id),
    scheduleIds: schedules.map((item) => item.id),
    sessionIds: sessions.map((item) => item.id),
  };
}
