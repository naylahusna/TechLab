import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
  type DocumentSnapshot,
  type Firestore,
} from 'firebase/firestore';
import { PracticumError } from './errors';
import {
  attendanceId,
  participantId,
  PRACTICUM_COLLECTIONS,
  sessionIdForSchedule,
} from './ids';
import type {
  PracticumAttendance,
  PracticumClass,
  PracticumClassInput,
  PracticumParticipant,
  PracticumParticipantInput,
  PracticumSchedule,
  PracticumScheduleInput,
  PracticumSession,
  PracticumSessionStatus,
} from './types';
import {
  validateClassInput,
  validateParticipantInput,
  validateScheduleInput,
} from './validation';

function asTimestamp(value: unknown): Timestamp {
  if (value instanceof Timestamp) return value;
  if (
    value &&
    typeof value === 'object' &&
    'toMillis' in value &&
    typeof (value as { toMillis?: unknown }).toMillis === 'function'
  ) {
    return value as Timestamp;
  }
  return Timestamp.fromMillis(0);
}

function asNullableTimestamp(value: unknown): Timestamp | null {
  return value == null ? null : asTimestamp(value);
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function asSessionStatus(value: unknown): PracticumSessionStatus {
  if (value === 'scheduled' || value === 'open' || value === 'closed' || value === 'cancelled')
    return value;
  throw new PracticumError('INVALID_INPUT', 'Status sesi tidak valid.');
}

function toClass(snapshot: DocumentSnapshot<DocumentData>): PracticumClass {
  const data = snapshot.data() ?? {};
  return {
    id: snapshot.id,
    className: asString(data.className),
    courseName: asString(data.courseName),
    assistantIds: asStringList(data.assistantIds),
    studentIds: asStringList(data.studentIds),
    memberIds: asStringList(data.memberIds),
    createdAt: asTimestamp(data.createdAt),
    updatedAt: asTimestamp(data.updatedAt),
    archivedAt: asNullableTimestamp(data.archivedAt),
  };
}

function toParticipant(snapshot: DocumentSnapshot<DocumentData>): PracticumParticipant {
  const data = snapshot.data() ?? {};
  return {
    id: snapshot.id,
    classId: asString(data.classId),
    userId: asString(data.userId),
    studentNumber: asString(data.studentNumber),
    joinedAt: asTimestamp(data.joinedAt),
    leftAt: asNullableTimestamp(data.leftAt),
  };
}

function toSchedule(snapshot: DocumentSnapshot<DocumentData>): PracticumSchedule {
  const data = snapshot.data() ?? {};
  return {
    id: snapshot.id,
    classId: asString(data.classId),
    title: asString(data.title),
    startAt: asTimestamp(data.startAt),
    endAt: asTimestamp(data.endAt),
    location: asString(data.location),
    createdAt: asTimestamp(data.createdAt),
    updatedAt: asTimestamp(data.updatedAt),
    archivedAt: asNullableTimestamp(data.archivedAt),
  };
}

function toSession(snapshot: DocumentSnapshot<DocumentData>): PracticumSession {
  const data = snapshot.data() ?? {};
  return {
    id: snapshot.id,
    scheduleId: asString(data.scheduleId),
    classId: asString(data.classId),
    studentIds: asStringList(data.studentIds),
    startAt: asTimestamp(data.startAt),
    endAt: asTimestamp(data.endAt),
    status: asSessionStatus(data.status),
    openedAt: asNullableTimestamp(data.openedAt),
    closedAt: asNullableTimestamp(data.closedAt),
    cancelledAt: asNullableTimestamp(data.cancelledAt),
    createdBy: asString(data.createdBy),
    createdAt: asTimestamp(data.createdAt),
    updatedAt: asTimestamp(data.updatedAt),
  };
}

function toAttendance(snapshot: DocumentSnapshot<DocumentData>): PracticumAttendance {
  const data = snapshot.data() ?? {};
  if (data.status !== 'present')
    throw new PracticumError('INVALID_INPUT', 'Status presensi tidak valid.');
  return {
    id: snapshot.id,
    sessionId: asString(data.sessionId),
    classId: asString(data.classId),
    userId: asString(data.userId),
    status: 'present',
    recordedAt: asTimestamp(data.recordedAt),
  };
}

function byStartAt<T extends { startAt: Timestamp }>(left: T, right: T): number {
  return left.startAt.toMillis() - right.startAt.toMillis();
}

function byRecordedAt(left: PracticumAttendance, right: PracticumAttendance): number {
  return left.recordedAt.toMillis() - right.recordedAt.toMillis();
}

/**
 * Repository praktikum untuk SRS-06–12.
 *
 * Semua method menerima `Firestore` agar bisa dipakai di aplikasi, tes emulator,
 * dan seed. Otorisasi tetap ditegakkan Security Rules; repository hanya
 * menyediakan operasi yang aman dan pesan error yang ramah.
 */
export function createPracticumRepository(db: Firestore) {
  const classes = collection(db, PRACTICUM_COLLECTIONS.classes);
  const participants = collection(db, PRACTICUM_COLLECTIONS.participants);
  const schedules = collection(db, PRACTICUM_COLLECTIONS.schedules);
  const sessions = collection(db, PRACTICUM_COLLECTIONS.sessions);
  const attendances = collection(db, PRACTICUM_COLLECTIONS.attendances);

  async function classesForPractitioner(userId: string): Promise<PracticumClass[]> {
    const snapshot = await getDocs(query(classes, where('memberIds', 'array-contains', userId)));
    return snapshot.docs
      .map(toClass)
      .filter((item) => !item.archivedAt)
      .sort((left, right) => left.className.localeCompare(right.className));
  }

  async function classIdsForPractitioner(userId: string): Promise<string[]> {
    return (await classesForPractitioner(userId)).map((item) => item.id);
  }

  async function listParticipantsForClass(
    classId: string,
    includeLeft = false,
  ): Promise<PracticumParticipant[]> {
    const classSnapshot = await getDoc(doc(classes, classId));
    if (!classSnapshot.exists()) return [];
    const classItem = toClass(classSnapshot);
    const snapshots = await Promise.all(
      classItem.studentIds.map((userId) =>
        getDoc(doc(participants, participantId(classId, userId))),
      ),
    );
    return snapshots
      .filter((snapshot) => snapshot.exists())
      .map(toParticipant)
      .filter((item) => includeLeft || !item.leftAt)
      .sort((left, right) => left.studentNumber.localeCompare(right.studentNumber));
  }

  async function transitionSession(
    sessionId: string,
    next: 'open' | 'closed' | 'cancelled',
  ): Promise<void> {
    await runTransaction(db, async (transaction) => {
      const ref = doc(sessions, sessionId);
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists())
        throw new PracticumError('NOT_FOUND', 'Sesi praktikum tidak ditemukan.');
      const session = toSession(snapshot);
      const allowed =
        (next === 'open' && session.status === 'scheduled') ||
        (next === 'closed' && session.status === 'open') ||
        (next === 'cancelled' &&
          (session.status === 'scheduled' || session.status === 'open'));
      if (!allowed)
        throw new PracticumError(
          'INVALID_TRANSITION',
          'Status sesi tidak dapat diubah dari kondisi saat ini.',
        );

      const patch: Record<string, unknown> = {
        status: next,
        updatedAt: serverTimestamp(),
      };
      if (next === 'open') patch.openedAt = serverTimestamp();
      if (next === 'closed') patch.closedAt = serverTimestamp();
      if (next === 'cancelled') patch.cancelledAt = serverTimestamp();
      transaction.update(ref, patch);
    });
  }

  return {
    // SRS-06 — Class Management
    async getClass(classId: string): Promise<PracticumClass | null> {
      const snapshot = await getDoc(doc(classes, classId));
      return snapshot.exists() ? toClass(snapshot) : null;
    },

    async listClassesForAssistant(assistantId: string): Promise<PracticumClass[]> {
      const snapshot = await getDocs(
        query(classes, where('memberIds', 'array-contains', assistantId)),
      );
      return snapshot.docs
        .map(toClass)
        .filter((item) => !item.archivedAt)
        .sort((left, right) => left.className.localeCompare(right.className));
    },

    async listClassesForPractitioner(userId: string): Promise<PracticumClass[]> {
      return classesForPractitioner(userId);
    },

    async createClass(input: PracticumClassInput, assistantId: string): Promise<string> {
      const clean = validateClassInput(input);
      const assistantIds = Array.from(new Set([...(clean.assistantIds ?? []), assistantId]));
      const ref = doc(classes);
      await setDoc(ref, {
        className: clean.className,
        courseName: clean.courseName,
        assistantIds,
        studentIds: [],
        memberIds: assistantIds,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        archivedAt: null,
      });
      return ref.id;
    },

    async updateClass(classId: string, input: PracticumClassInput): Promise<void> {
      const clean = validateClassInput(input);
      await runTransaction(db, async (transaction) => {
        const ref = doc(classes, classId);
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists())
          throw new PracticumError('NOT_FOUND', 'Kelas tidak ditemukan.');
        const current = toClass(snapshot);
        const patch: Record<string, unknown> = {
          className: clean.className,
          courseName: clean.courseName,
          updatedAt: serverTimestamp(),
        };
        if (clean.assistantIds) {
          patch.assistantIds = clean.assistantIds;
          patch.memberIds = Array.from(
            new Set([...clean.assistantIds, ...current.studentIds]),
          );
        }
        transaction.update(ref, patch);
      });
    },

    async archiveClass(classId: string): Promise<void> {
      await updateDoc(doc(classes, classId), {
        archivedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    },

    // SRS-07 — Participant Management
    async listParticipants(
      classId: string,
      includeLeft = false,
    ): Promise<PracticumParticipant[]> {
      return listParticipantsForClass(classId, includeLeft);
    },

    async getParticipant(classId: string, userId: string): Promise<PracticumParticipant | null> {
      const snapshot = await getDoc(doc(participants, participantId(classId, userId)));
      return snapshot.exists() ? toParticipant(snapshot) : null;
    },

    async addParticipant(input: PracticumParticipantInput): Promise<string> {
      const clean = validateParticipantInput(input);
      return runTransaction(db, async (transaction) => {
        const classRef = doc(classes, clean.classId);
        const classSnapshot = await transaction.get(classRef);
        if (!classSnapshot.exists())
          throw new PracticumError('NOT_FOUND', 'Kelas tidak ditemukan.');
        const classItem = toClass(classSnapshot);
        if (classItem.archivedAt)
          throw new PracticumError('INVALID_INPUT', 'Kelas sudah diarsipkan.');

        const ref = doc(participants, participantId(clean.classId, clean.userId));
        const existing = await transaction.get(ref);
        if (existing.exists()) {
          const participant = toParticipant(existing);
          if (!participant.leftAt)
            throw new PracticumError('DUPLICATE', 'Peserta sudah terdaftar pada kelas ini.');
          transaction.update(ref, {
            leftAt: null,
            studentNumber: clean.studentNumber,
          });
        } else {
          transaction.set(ref, {
            classId: clean.classId,
            userId: clean.userId,
            studentNumber: clean.studentNumber,
            joinedAt: serverTimestamp(),
            leftAt: null,
          });
        }

        if (!classItem.studentIds.includes(clean.userId)) {
          transaction.update(classRef, {
            studentIds: [...classItem.studentIds, clean.userId],
            memberIds: [...classItem.memberIds, clean.userId],
            updatedAt: serverTimestamp(),
          });
        }
        return ref.id;
      });
    },

    async removeParticipant(classId: string, userId: string): Promise<void> {
      await runTransaction(db, async (transaction) => {
        const classRef = doc(classes, classId);
        const classSnapshot = await transaction.get(classRef);
        if (!classSnapshot.exists())
          throw new PracticumError('NOT_FOUND', 'Kelas tidak ditemukan.');
        const participantRef = doc(participants, participantId(classId, userId));
        const participantSnapshot = await transaction.get(participantRef);
        if (!participantSnapshot.exists())
          throw new PracticumError('NOT_FOUND', 'Peserta tidak ditemukan.');

        transaction.update(participantRef, { leftAt: serverTimestamp() });
        const classItem = toClass(classSnapshot);
        transaction.update(classRef, {
          studentIds: classItem.studentIds.filter((id) => id !== userId),
          memberIds: classItem.memberIds.filter((id) => id !== userId),
          updatedAt: serverTimestamp(),
        });
      });
    },

    // SRS-08 — Schedule Management
    async getSchedule(scheduleId: string): Promise<PracticumSchedule | null> {
      const snapshot = await getDoc(doc(schedules, scheduleId));
      return snapshot.exists() ? toSchedule(snapshot) : null;
    },

    async listSchedules(classId: string): Promise<PracticumSchedule[]> {
      const snapshot = await getDocs(
        query(schedules, where('classId', '==', classId), orderBy('startAt', 'asc')),
      );
      return snapshot.docs
        .map(toSchedule)
        .filter((item) => !item.archivedAt)
        .sort(byStartAt);
    },

    async listSchedulesForPractitioner(userId: string): Promise<PracticumSchedule[]> {
      const classIds = await classIdsForPractitioner(userId);
      const snapshots = await Promise.all(
        classIds.map((classId) =>
          getDocs(query(schedules, where('classId', '==', classId), orderBy('startAt', 'asc'))),
        ),
      );
      return snapshots
        .flatMap((snapshot) => snapshot.docs.map(toSchedule))
        .filter((item) => !item.archivedAt)
        .sort(byStartAt);
    },

    async createSchedule(input: PracticumScheduleInput): Promise<string> {
      const clean = validateScheduleInput(input);
      const ref = doc(schedules);
      await setDoc(ref, {
        classId: clean.classId,
        title: clean.title,
        startAt: Timestamp.fromDate(clean.startAt),
        endAt: Timestamp.fromDate(clean.endAt),
        location: clean.location,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        archivedAt: null,
      });
      return ref.id;
    },

    async updateSchedule(scheduleId: string, input: PracticumScheduleInput): Promise<void> {
      const clean = validateScheduleInput(input);
      await updateDoc(doc(schedules, scheduleId), {
        title: clean.title,
        startAt: Timestamp.fromDate(clean.startAt),
        endAt: Timestamp.fromDate(clean.endAt),
        location: clean.location,
        updatedAt: serverTimestamp(),
      });
    },

    async archiveSchedule(scheduleId: string): Promise<void> {
      await updateDoc(doc(schedules, scheduleId), {
        archivedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    },

    // SRS-09 — Practicum Session Management
    async getSession(sessionId: string): Promise<PracticumSession | null> {
      const snapshot = await getDoc(doc(sessions, sessionId));
      return snapshot.exists() ? toSession(snapshot) : null;
    },

    async listSessions(classId: string): Promise<PracticumSession[]> {
      const snapshot = await getDocs(
        query(sessions, where('classId', '==', classId), orderBy('startAt', 'asc')),
      );
      return snapshot.docs.map(toSession).sort(byStartAt);
    },

    async listSessionsForPractitioner(userId: string): Promise<PracticumSession[]> {
      const classIds = await classIdsForPractitioner(userId);
      const snapshots = await Promise.all(
        classIds.map((classId) =>
          getDocs(query(sessions, where('classId', '==', classId), orderBy('startAt', 'asc'))),
        ),
      );
      return snapshots
        .flatMap((snapshot) => snapshot.docs.map(toSession))
        .sort(byStartAt);
    },

    async createSessionFromSchedule(scheduleId: string, createdBy: string): Promise<string> {
      return runTransaction(db, async (transaction) => {
        const scheduleRef = doc(schedules, scheduleId);
        const scheduleSnapshot = await transaction.get(scheduleRef);
        if (!scheduleSnapshot.exists())
          throw new PracticumError('NOT_FOUND', 'Jadwal praktikum tidak ditemukan.');
        const schedule = toSchedule(scheduleSnapshot);
        if (schedule.archivedAt)
          throw new PracticumError('INVALID_INPUT', 'Jadwal sudah diarsipkan.');

        const classRef = doc(classes, schedule.classId);
        const classSnapshot = await transaction.get(classRef);
        if (!classSnapshot.exists())
          throw new PracticumError('NOT_FOUND', 'Kelas tidak ditemukan.');
        const classItem = toClass(classSnapshot);

        const sessionId = sessionIdForSchedule(scheduleId);
        const sessionRef = doc(sessions, sessionId);
        const existing = await transaction.get(sessionRef);
        if (existing.exists())
          throw new PracticumError('DUPLICATE', 'Sesi untuk jadwal ini sudah dibuat.');

        transaction.set(sessionRef, {
          scheduleId,
          classId: schedule.classId,
          studentIds: classItem.studentIds,
          startAt: schedule.startAt,
          endAt: schedule.endAt,
          status: 'scheduled',
          openedAt: null,
          closedAt: null,
          cancelledAt: null,
          createdBy,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return sessionId;
      });
    },

    openSession(sessionId: string): Promise<void> {
      return transitionSession(sessionId, 'open');
    },

    closeSession(sessionId: string): Promise<void> {
      return transitionSession(sessionId, 'closed');
    },

    cancelSession(sessionId: string): Promise<void> {
      return transitionSession(sessionId, 'cancelled');
    },

    // SRS-10 — Practicum Attendance
    async getAttendance(sessionId: string, userId: string): Promise<PracticumAttendance | null> {
      const snapshot = await getDoc(doc(attendances, attendanceId(sessionId, userId)));
      return snapshot.exists() ? toAttendance(snapshot) : null;
    },

    async listAttendance(sessionId: string): Promise<PracticumAttendance[]> {
      const sessionSnapshot = await getDoc(doc(sessions, sessionId));
      if (!sessionSnapshot.exists())
        throw new PracticumError('NOT_FOUND', 'Sesi praktikum tidak ditemukan.');
      const session = toSession(sessionSnapshot);
      const records = await Promise.all(
        session.studentIds.map(async (userId) => {
          const snapshot = await getDoc(doc(attendances, attendanceId(sessionId, userId)));
          return snapshot.exists() ? toAttendance(snapshot) : null;
        }),
      );
      return records
        .filter((record): record is PracticumAttendance => record !== null)
        .sort(byRecordedAt);
    },

    async recordAttendance(sessionId: string, userId: string): Promise<string> {
      return runTransaction(db, async (transaction) => {
        const sessionRef = doc(sessions, sessionId);
        const sessionSnapshot = await transaction.get(sessionRef);
        if (!sessionSnapshot.exists())
          throw new PracticumError('NOT_FOUND', 'Sesi praktikum tidak ditemukan.');
        const session = toSession(sessionSnapshot);
        if (session.status !== 'open')
          throw new PracticumError(
            'SESSION_NOT_OPEN',
            'Presensi hanya dapat dilakukan saat sesi dibuka.',
          );

        const participantRef = doc(participants, participantId(session.classId, userId));
        const participantSnapshot = await transaction.get(participantRef);
        if (!participantSnapshot.exists())
          throw new PracticumError('NOT_ENROLLED', 'Kamu tidak terdaftar pada kelas ini.');
        const participant = toParticipant(participantSnapshot);
        if (participant.leftAt)
          throw new PracticumError(
            'NOT_ENROLLED',
            'Keanggotaanmu pada kelas ini sudah tidak aktif.',
          );

        const ref = doc(attendances, attendanceId(sessionId, userId));
        const existing = await transaction.get(ref);
        if (existing.exists())
          throw new PracticumError('ALREADY_PRESENT', 'Kamu sudah presensi pada sesi ini.');

        transaction.set(ref, {
          sessionId,
          classId: session.classId,
          userId,
          status: 'present',
          recordedAt: serverTimestamp(),
        });
        return ref.id;
      });
    },
  };
}

export type PracticumRepository = ReturnType<typeof createPracticumRepository>;
