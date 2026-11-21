import { getAuth } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
  type DocumentReference,
  type DocumentSnapshot,
  type Firestore,
  type Query,
} from 'firebase/firestore';
import { PracticumError } from './errors';
import { calculateDistanceMeters } from '../practitioner/lib/location-validation';
import { attendanceId, participantId, PRACTICUM_COLLECTIONS, sessionIdForSchedule } from './ids';
import type {
  PracticumAttendance,
  PracticumClass,
  PracticumClassInput,
  PracticumDirectoryUser,
  PracticumParticipant,
  PracticumParticipantInput,
  PracticumPermission,
  PracticumPermissionAiStatus,
  PracticumPermissionStatus,
  PracticumRecapEntry,
  PracticumRecapStatus,
  PracticumSchedule,
  PracticumScheduleInput,
  PracticumSession,
  PracticumSessionStatus,
} from './types';
import { findScheduleConflict } from './schedule-conflict';
import {
  validateClassInput,
  validateParticipantInput,
  validateScheduleInput,
  validateSessionOpenWindow,
} from './validation';

type SubscriptionListener = (fromCache: boolean) => void;
type SubscriptionErrorHandler = (error: Error) => void;

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
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asNullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asPermissionStatus(value: unknown): PracticumPermissionStatus {
  if (value === 'pending' || value === 'approved' || value === 'rejected') return value;
  return 'pending';
}

function asPermissionAiStatus(value: unknown): PracticumPermissionAiStatus {
  if (
    value === 'processing' ||
    value === 'completed' ||
    value === 'failed' ||
    value === 'unavailable'
  )
    return value;
  return 'unavailable';
}

function deriveRecapStatus(
  attendance: PracticumAttendance | null,
  permission: PracticumPermission | null,
  sessionStatus: PracticumSessionStatus,
): PracticumRecapStatus {
  if (attendance) return 'present';
  if (permission?.status === 'approved') return 'excused';
  if (permission?.status === 'pending') return 'pending';
  if (sessionStatus === 'closed' || sessionStatus === 'cancelled') return 'absent';
  return 'belum-presensi';
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
    studentName: asString(data.studentName),
    studentNumber: asString(data.studentNumber),
    joinedAt: asTimestamp(data.joinedAt),
    leftAt: asNullableTimestamp(data.leftAt),
  };
}

function toDirectoryUser(snapshot: DocumentSnapshot<DocumentData>): PracticumDirectoryUser {
  const data = snapshot.data() ?? {};
  return {
    uid: asString(data.uid, snapshot.id),
    name: asString(data.name),
    number: asString(data.number),
    role: data.role === 'asisten' ? 'asisten' : 'praktikan',
    updatedAt: asTimestamp(data.updatedAt),
  };
}

function toPermission(snapshot: DocumentSnapshot<DocumentData>): PracticumPermission {
  const data = snapshot.data() ?? {};
  return {
    id: snapshot.id,
    sessionId: asString(data.sessionId),
    classId: asString(data.classId),
    userId: asString(data.userId),
    reason: asString(data.reason),
    aiCategory: asNullableString(data.aiCategory),
    aiConfidence: asNullableNumber(data.aiConfidence),
    aiStatus: asPermissionAiStatus(data.aiStatus),
    status: asPermissionStatus(data.status),
    decidedBy: asNullableString(data.decidedBy),
    decidedAt: asNullableTimestamp(data.decidedAt),
    createdAt: asTimestamp(data.createdAt),
    updatedAt: asTimestamp(data.updatedAt),
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
    openedBy: asNullableString(data.openedBy),
    closedBy: asNullableString(data.closedBy),
    cancelledBy: asNullableString(data.cancelledBy),
    createdBy: asString(data.createdBy),
    createdAt: asTimestamp(data.createdAt),
    updatedAt: asTimestamp(data.updatedAt),
  };
}

function toAttendance(snapshot: DocumentSnapshot<DocumentData>): PracticumAttendance {
  const data = snapshot.data() ?? {};
  if (data.status !== 'present')
    throw new PracticumError('INVALID_INPUT', 'Status presensi tidak valid.');
  if (
    typeof data.latitude !== 'number'
    || typeof data.longitude !== 'number'
    || typeof data.distanceMeters !== 'number'
    || typeof data.allowedRadiusMeters !== 'number'
    || data.locationValidated !== true
  ) {
    throw new PracticumError('INVALID_INPUT', 'Data lokasi presensi tidak valid.');
  }
  return {
    id: snapshot.id,
    sessionId: asString(data.sessionId),
    classId: asString(data.classId),
    userId: asString(data.userId),
    status: 'present',
    recordedAt: asTimestamp(data.recordedAt),
    latitude: data.latitude,
    longitude: data.longitude,
    accuracyMeters: typeof data.accuracyMeters === 'number' ? data.accuracyMeters : null,
    distanceMeters: data.distanceMeters,
    allowedRadiusMeters: data.allowedRadiusMeters,
    locationValidated: true,
    labName: asString(data.labName),
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
  const permissions = collection(db, PRACTICUM_COLLECTIONS.permissions);
  const userDirectory = collection(db, PRACTICUM_COLLECTIONS.userDirectory);

  async function classesForAssistant(assistantId: string): Promise<PracticumClass[]> {
    const snapshot = await getDocs(
      query(classes, where('memberIds', 'array-contains', assistantId)),
    );
    return snapshot.docs
      .map(toClass)
      .filter((item) => !item.archivedAt)
      .sort((left, right) => left.className.localeCompare(right.className));
  }

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
    const snapshot = await getDocs(query(participants, where('classId', '==', classId)));
    return snapshot.docs
      .map(toParticipant)
      .filter((item) => includeLeft || !item.leftAt)
      .sort((left, right) => left.studentNumber.localeCompare(right.studentNumber));
  }

  async function participantsByIds(
    classId: string,
    userIds: readonly string[],
  ): Promise<PracticumParticipant[]> {
    const snapshots = await Promise.all(
      userIds.map((userId) => getDoc(doc(participants, participantId(classId, userId)))),
    );
    return snapshots
      .filter((snapshot) => snapshot.exists())
      .map(toParticipant)
      .sort((left, right) => left.studentNumber.localeCompare(right.studentNumber));
  }

  async function listAttendanceForSession(
    session: PracticumSession,
  ): Promise<PracticumAttendance[]> {
    const snapshot = await getDocs(
      query(
        attendances,
        where('sessionId', '==', session.id),
        where('classId', '==', session.classId),
      ),
    );
    return snapshot.docs.map(toAttendance).sort(byRecordedAt);
  }

  async function listPermissionsForSession(
    session: PracticumSession,
  ): Promise<PracticumPermission[]> {
    const snapshot = await getDocs(
      query(
        permissions,
        where('sessionId', '==', session.id),
        where('classId', '==', session.classId),
      ),
    );
    return snapshot.docs.map(toPermission);
  }

  function subscribeToQuery(
    target: Query<DocumentData>,
    onChange: SubscriptionListener,
    onError?: SubscriptionErrorHandler,
  ) {
    return onSnapshot(
      target,
      { includeMetadataChanges: true },
      (snapshot) => onChange(snapshot.metadata.fromCache),
      onError,
    );
  }

  function subscribeToDocument(
    target: DocumentReference<DocumentData>,
    onChange: SubscriptionListener,
    onError?: SubscriptionErrorHandler,
  ) {
    return onSnapshot(
      target,
      { includeMetadataChanges: true },
      (snapshot) => onChange(snapshot.metadata.fromCache),
      onError,
    );
  }

  function subscribeToMemberClasses(
    memberId: string,
    onChange: SubscriptionListener,
    onError?: SubscriptionErrorHandler,
  ) {
    return subscribeToQuery(
      query(classes, where('memberIds', 'array-contains', memberId)),
      onChange,
      onError,
    );
  }

  async function schedulesForClass(classId: string): Promise<PracticumSchedule[]> {
    const snapshot = await getDocs(query(schedules, where('classId', '==', classId)));
    return snapshot.docs.map(toSchedule);
  }

  function scheduleConflictMessage(conflict: PracticumSchedule): string {
    return `Jadwal bentrok dengan "${conflict.title}". Pilih waktu lain.`;
  }

  function currentAuthUid(): string | undefined {
    try {
      return getAuth(db.app).currentUser?.uid ?? undefined;
    } catch {
      return undefined;
    }
  }

  function sameStringList(left: readonly string[], right: readonly string[]): boolean {
    return left.length === right.length && left.every((item, index) => item === right[index]);
  }

  async function ensureSessionForSchedule(
    scheduleId: string,
    createdBy?: string,
  ): Promise<string> {
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

      const actorUid =
        createdBy?.trim() || currentAuthUid() || classItem.assistantIds[0] || '';
      if (!actorUid)
        throw new PracticumError('INVALID_INPUT', 'Pelaku pembuatan sesi tidak valid.');

      const sessionId = sessionIdForSchedule(scheduleId);
      const sessionRef = doc(sessions, sessionId);
      const existing = await transaction.get(sessionRef);
      if (existing.exists()) {
        const currentSession = toSession(existing);
        if (
          (currentSession.status === 'scheduled' || currentSession.status === 'open') &&
          (!sameStringList(currentSession.studentIds, classItem.studentIds) ||
            currentSession.startAt.toMillis() !== schedule.startAt.toMillis() ||
            currentSession.endAt.toMillis() !== schedule.endAt.toMillis())
        ) {
          transaction.update(sessionRef, {
            studentIds: classItem.studentIds,
            startAt: schedule.startAt,
            endAt: schedule.endAt,
            updatedAt: serverTimestamp(),
          });
        }
        return sessionId;
      }

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
        openedBy: null,
        closedBy: null,
        cancelledBy: null,
        createdBy: actorUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return sessionId;
    });
  }

  async function syncActiveSessionStudents(classId: string): Promise<void> {
    const [classSnapshot, sessionSnapshots] = await Promise.all([
      getDoc(doc(classes, classId)),
      getDocs(query(sessions, where('classId', '==', classId))),
    ]);
    if (!classSnapshot.exists()) return;
    const classItem = toClass(classSnapshot);
    await Promise.all(
      sessionSnapshots.docs.map(async (snapshot) => {
        const session = toSession(snapshot);
        if (
          (session.status === 'scheduled' || session.status === 'open') &&
          !sameStringList(session.studentIds, classItem.studentIds)
        ) {
          await updateDoc(doc(sessions, session.id), {
            studentIds: classItem.studentIds,
            startAt: session.startAt,
            endAt: session.endAt,
            updatedAt: serverTimestamp(),
          });
        }
      }),
    );
  }

  async function transitionSession(
    sessionId: string,
    next: 'open' | 'closed' | 'cancelled',
    actorId: string,
    now: Date = new Date(),
  ): Promise<void> {
    if (!actorId.trim())
      throw new PracticumError('INVALID_INPUT', 'Pelaku perubahan sesi tidak valid.');

    await runTransaction(db, async (transaction) => {
      const ref = doc(sessions, sessionId);
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists())
        throw new PracticumError('NOT_FOUND', 'Sesi praktikum tidak ditemukan.');
      const session = toSession(snapshot);
      const allowed =
        (next === 'open' && session.status === 'scheduled') ||
        (next === 'closed' && session.status === 'open') ||
        (next === 'cancelled' && (session.status === 'scheduled' || session.status === 'open'));
      if (!allowed)
        throw new PracticumError(
          'INVALID_TRANSITION',
          'Status sesi tidak dapat diubah dari kondisi saat ini.',
        );

      if (next === 'open') {
        const windowCheck = validateSessionOpenWindow(session, now);
        if (!windowCheck.ok) {
          throw new PracticumError('INVALID_TIME', windowCheck.message);
        }
      }

      const patch: Record<string, unknown> = {
        status: next,
        updatedAt: serverTimestamp(),
      };
      if (next === 'open') {
        const classSnapshot = await transaction.get(doc(classes, session.classId));
        if (classSnapshot.exists()) {
          patch.studentIds = toClass(classSnapshot).studentIds;
        }
        patch.openedAt = serverTimestamp();
        patch.openedBy = actorId;
      }
      if (next === 'closed') {
        patch.closedAt = serverTimestamp();
        patch.closedBy = actorId;
      }
      if (next === 'cancelled') {
        patch.cancelledAt = serverTimestamp();
        patch.cancelledBy = actorId;
      }
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
      return classesForAssistant(assistantId);
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
        if (!snapshot.exists()) throw new PracticumError('NOT_FOUND', 'Kelas tidak ditemukan.');
        const current = toClass(snapshot);
        const patch: Record<string, unknown> = {
          className: clean.className,
          courseName: clean.courseName,
          updatedAt: serverTimestamp(),
        };
        if (clean.assistantIds) {
          patch.assistantIds = clean.assistantIds;
          patch.memberIds = Array.from(new Set([...clean.assistantIds, ...current.studentIds]));
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
    async listParticipants(classId: string, includeLeft = false): Promise<PracticumParticipant[]> {
      return listParticipantsForClass(classId, includeLeft);
    },

    async getParticipant(classId: string, userId: string): Promise<PracticumParticipant | null> {
      const snapshot = await getDoc(doc(participants, participantId(classId, userId)));
      return snapshot.exists() ? toParticipant(snapshot) : null;
    },

    async listParticipantsByIds(
      classId: string,
      userIds: readonly string[],
    ): Promise<PracticumParticipant[]> {
      return participantsByIds(classId, userIds);
    },

    async searchDirectoryUsers(term: string): Promise<PracticumDirectoryUser[]> {
      const normalized = term.trim();
      if (!normalized) return [];
      const [byNumber, byName] = await Promise.all([
        getDocs(
          query(
            userDirectory,
            where('role', '==', 'praktikan'),
            where('number', '>=', normalized),
            where('number', '<=', `${normalized}\uf8ff`),
            limit(10),
          ),
        ),
        getDocs(
          query(
            userDirectory,
            where('role', '==', 'praktikan'),
            where('name', '>=', normalized),
            where('name', '<=', `${normalized}\uf8ff`),
            limit(10),
          ),
        ),
      ]);
      const merged = new Map<string, PracticumDirectoryUser>();
      [...byNumber.docs, ...byName.docs].forEach((snapshot) => {
        const user = toDirectoryUser(snapshot);
        merged.set(user.uid, user);
      });
      return Array.from(merged.values()).sort((left, right) => left.name.localeCompare(right.name));
    },

    async addParticipant(input: PracticumParticipantInput): Promise<string> {
      const clean = validateParticipantInput(input);
      const addedId = await runTransaction(db, async (transaction) => {
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
            studentName: clean.studentName,
            studentNumber: clean.studentNumber,
          });
        } else {
          transaction.set(ref, {
            classId: clean.classId,
            userId: clean.userId,
            studentName: clean.studentName,
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
      await syncActiveSessionStudents(clean.classId);
      return addedId;
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
      await syncActiveSessionStudents(classId);
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

    async listSchedulesForAssistant(assistantId: string): Promise<PracticumSchedule[]> {
      const assistantClasses = await classesForAssistant(assistantId);
      const snapshots = await Promise.all(
        assistantClasses.map((classItem) =>
          getDocs(
            query(schedules, where('classId', '==', classItem.id), orderBy('startAt', 'asc')),
          ),
        ),
      );
      return snapshots
        .flatMap((snapshot) => snapshot.docs.map(toSchedule))
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

    async createSchedule(input: PracticumScheduleInput, createdBy?: string): Promise<string> {
      const clean = validateScheduleInput(input);
      const conflict = findScheduleConflict(await schedulesForClass(clean.classId), {
        classId: clean.classId,
        startAt: clean.startAt,
        endAt: clean.endAt,
      });
      if (conflict)
        throw new PracticumError('SCHEDULE_CONFLICT', scheduleConflictMessage(conflict));

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
      await ensureSessionForSchedule(ref.id, createdBy);
      return ref.id;
    },

    async updateSchedule(scheduleId: string, input: PracticumScheduleInput): Promise<void> {
      const clean = validateScheduleInput(input);
      const snapshot = await getDoc(doc(schedules, scheduleId));
      if (!snapshot.exists())
        throw new PracticumError('NOT_FOUND', 'Jadwal praktikum tidak ditemukan.');
      const current = toSchedule(snapshot);
      if (clean.classId !== current.classId)
        throw new PracticumError('INVALID_INPUT', 'Kelas jadwal tidak dapat diubah.');

      const conflict = findScheduleConflict(await schedulesForClass(current.classId), {
        classId: current.classId,
        startAt: clean.startAt,
        endAt: clean.endAt,
        excludeScheduleId: scheduleId,
      });
      if (conflict)
        throw new PracticumError('SCHEDULE_CONFLICT', scheduleConflictMessage(conflict));

      const nextStartAt = Timestamp.fromDate(clean.startAt);
      const nextEndAt = Timestamp.fromDate(clean.endAt);
      await updateDoc(doc(schedules, scheduleId), {
        title: clean.title,
        startAt: nextStartAt,
        endAt: nextEndAt,
        location: clean.location,
        updatedAt: serverTimestamp(),
      });

      const sessionRef = doc(sessions, sessionIdForSchedule(scheduleId));
      const [sessionSnapshot, classSnapshot] = await Promise.all([
        getDoc(sessionRef),
        getDoc(doc(classes, current.classId)),
      ]);
      if (sessionSnapshot.exists() && classSnapshot.exists()) {
        const session = toSession(sessionSnapshot);
        if (session.status === 'scheduled' || session.status === 'open') {
          await updateDoc(sessionRef, {
            studentIds: toClass(classSnapshot).studentIds,
            startAt: nextStartAt,
            endAt: nextEndAt,
            updatedAt: serverTimestamp(),
          });
        }
      }
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
      const [sessionSnapshot, scheduleSnapshot] = await Promise.all([
        getDocs(query(sessions, where('classId', '==', classId), orderBy('startAt', 'asc'))),
        getDocs(query(schedules, where('classId', '==', classId))),
      ]);
      const archivedScheduleIds = new Set(
        scheduleSnapshot.docs
          .map(toSchedule)
          .filter((item) => item.archivedAt !== null)
          .map((item) => item.id),
      );
      return sessionSnapshot.docs
        .map(toSession)
        .filter((item) => !archivedScheduleIds.has(item.scheduleId))
        .sort(byStartAt);
    },

    async listSessionsForAssistant(assistantId: string): Promise<PracticumSession[]> {
      const assistantClasses = await classesForAssistant(assistantId);
      const [sessionSnapshots, scheduleSnapshots] = await Promise.all([
        Promise.all(
          assistantClasses.map((classItem) =>
            getDocs(
              query(sessions, where('classId', '==', classItem.id), orderBy('startAt', 'asc')),
            ),
          ),
        ),
        Promise.all(
          assistantClasses.map((classItem) =>
            getDocs(query(schedules, where('classId', '==', classItem.id))),
          ),
        ),
      ]);
      const archivedScheduleIds = new Set(
        scheduleSnapshots
          .flatMap((snapshot) => snapshot.docs.map(toSchedule))
          .filter((item) => item.archivedAt !== null)
          .map((item) => item.id),
      );
      return sessionSnapshots
        .flatMap((snapshot) => snapshot.docs.map(toSession))
        .filter((item) => !archivedScheduleIds.has(item.scheduleId))
        .sort(byStartAt);
    },

    async listSessionsForPractitioner(userId: string): Promise<PracticumSession[]> {
      const classIds = await classIdsForPractitioner(userId);
      const [sessionSnapshots, scheduleSnapshots] = await Promise.all([
        Promise.all(
          classIds.map((classId) =>
            getDocs(query(sessions, where('classId', '==', classId), orderBy('startAt', 'asc'))),
          ),
        ),
        Promise.all(
          classIds.map((classId) => getDocs(query(schedules, where('classId', '==', classId)))),
        ),
      ]);
      const archivedScheduleIds = new Set(
        scheduleSnapshots
          .flatMap((snapshot) => snapshot.docs.map(toSchedule))
          .filter((item) => item.archivedAt !== null)
          .map((item) => item.id),
      );
      return sessionSnapshots
        .flatMap((snapshot) => snapshot.docs.map(toSession))
        .filter((item) => !archivedScheduleIds.has(item.scheduleId))
        .sort(byStartAt);
    },

    async createSessionFromSchedule(scheduleId: string, createdBy: string): Promise<string> {
      return ensureSessionForSchedule(scheduleId, createdBy);
    },

    openSession(sessionId: string, actorId: string, now?: Date): Promise<void> {
      return transitionSession(sessionId, 'open', actorId, now);
    },

    closeSession(sessionId: string, actorId: string): Promise<void> {
      return transitionSession(sessionId, 'closed', actorId);
    },

    cancelSession(sessionId: string, actorId: string): Promise<void> {
      return transitionSession(sessionId, 'cancelled', actorId);
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
      return listAttendanceForSession(toSession(sessionSnapshot));
    },

    async listPermissions(sessionId: string, classId: string): Promise<PracticumPermission[]> {
      const snapshot = await getDocs(
        query(permissions, where('sessionId', '==', sessionId), where('classId', '==', classId)),
      );
      return snapshot.docs.map(toPermission);
    },

    subscribeToClass(
      classId: string,
      onChange: SubscriptionListener,
      onError?: SubscriptionErrorHandler,
    ) {
      return subscribeToDocument(doc(classes, classId), onChange, onError);
    },

    subscribeToClassesForAssistant(
      assistantId: string,
      onChange: SubscriptionListener,
      onError?: SubscriptionErrorHandler,
    ) {
      return subscribeToMemberClasses(assistantId, onChange, onError);
    },

    subscribeToClassesForMember(
      memberId: string,
      onChange: SubscriptionListener,
      onError?: SubscriptionErrorHandler,
    ) {
      return subscribeToMemberClasses(memberId, onChange, onError);
    },

    subscribeToScheduleOverview(
      memberId: string,
      onChange: SubscriptionListener,
      onError?: SubscriptionErrorHandler,
    ) {
      let stopClassQueries: (() => void)[] = [];
      let activeClassKey: string | null = null;
      const cacheStates = new Map<string, boolean>();
      const emit = () => {
        onChange(Array.from(cacheStates.values()).some(Boolean));
      };
      const listen = (key: string, target: Query<DocumentData>) =>
        subscribeToQuery(
          target,
          (fromCache) => {
            cacheStates.set(key, fromCache);
            emit();
          },
          onError,
        );

      const stopClasses = onSnapshot(
        query(classes, where('memberIds', 'array-contains', memberId)),
        { includeMetadataChanges: true },
        (snapshot) => {
          cacheStates.set('classes', snapshot.metadata.fromCache);
          const classIds = snapshot.docs.map((item) => item.id).sort();
          const key = classIds.join('|');
          if (key !== activeClassKey) {
            activeClassKey = key;
            stopClassQueries.forEach((stop) => stop());
            for (const cacheKey of [...cacheStates.keys()]) {
              if (cacheKey !== 'classes') cacheStates.delete(cacheKey);
            }
            stopClassQueries = classIds.flatMap((classId) => [
              listen(
                `schedules:${classId}`,
                query(schedules, where('classId', '==', classId), orderBy('startAt', 'asc')),
              ),
              listen(
                `sessions:${classId}`,
                query(sessions, where('classId', '==', classId), orderBy('startAt', 'asc')),
              ),
              listen(
                `attendance:${classId}`,
                query(
                  attendances,
                  where('classId', '==', classId),
                  ...(snapshot.docs
                    .find((item) => item.id === classId)
                    ?.data()
                    .assistantIds.includes(memberId)
                    ? []
                    : [where('userId', '==', memberId)]),
                ),
              ),
              listen(
                `permissions:${classId}`,
                query(
                  permissions,
                  where('classId', '==', classId),
                  ...(snapshot.docs
                    .find((item) => item.id === classId)
                    ?.data()
                    .assistantIds.includes(memberId)
                    ? []
                    : [where('userId', '==', memberId)]),
                ),
              ),
            ]);
          }
          emit();
        },
        onError,
      );

      return () => {
        stopClasses();
        stopClassQueries.forEach((stop) => stop());
      };
    },

    subscribeToSchedules(
      classId: string,
      onChange: SubscriptionListener,
      onError?: SubscriptionErrorHandler,
    ) {
      return subscribeToQuery(
        query(schedules, where('classId', '==', classId), orderBy('startAt', 'asc')),
        onChange,
        onError,
      );
    },

    subscribeToSessions(
      classId: string,
      onChange: SubscriptionListener,
      onError?: SubscriptionErrorHandler,
    ) {
      return subscribeToQuery(
        query(sessions, where('classId', '==', classId), orderBy('startAt', 'asc')),
        onChange,
        onError,
      );
    },

    subscribeToParticipants(
      classId: string,
      onChange: SubscriptionListener,
      onError?: SubscriptionErrorHandler,
    ) {
      return subscribeToQuery(
        query(participants, where('classId', '==', classId)),
        onChange,
        onError,
      );
    },

    subscribeToSession(
      sessionId: string,
      onChange: SubscriptionListener,
      onError?: SubscriptionErrorHandler,
    ) {
      return subscribeToDocument(doc(sessions, sessionId), onChange, onError);
    },

    subscribeToOwnAttendance(
      sessionId: string,
      userId: string,
      onChange: SubscriptionListener,
      onError?: SubscriptionErrorHandler,
    ) {
      return subscribeToDocument(
        doc(attendances, attendanceId(sessionId, userId)),
        onChange,
        onError,
      );
    },

    subscribeToRecap(
      sessionId: string,
      onChange: SubscriptionListener,
      onError?: SubscriptionErrorHandler,
    ) {
      let stopAttendance: (() => void) | undefined;
      let stopPermissions: (() => void) | undefined;
      let lastClassId: string | null = null;
      const cacheStates = new Map<string, boolean>();
      const emit = () => {
        onChange(Array.from(cacheStates.values()).some(Boolean));
      };

      const stopSession = onSnapshot(
        doc(sessions, sessionId),
        { includeMetadataChanges: true },
        (snapshot) => {
          cacheStates.set('session', snapshot.metadata.fromCache);
          if (!snapshot.exists()) {
            stopAttendance?.();
            stopPermissions?.();
            stopAttendance = undefined;
            stopPermissions = undefined;
            lastClassId = null;
            cacheStates.delete('attendance');
            cacheStates.delete('permissions');
            emit();
            return;
          }
          const session = toSession(snapshot);
          if (session.classId !== lastClassId) {
            lastClassId = session.classId;
            stopAttendance?.();
            stopPermissions?.();
            stopAttendance = subscribeToQuery(
              query(
                attendances,
                where('sessionId', '==', sessionId),
                where('classId', '==', session.classId),
              ),
              (fromCache) => {
                cacheStates.set('attendance', fromCache);
                emit();
              },
              onError,
            );
            stopPermissions = subscribeToQuery(
              query(
                permissions,
                where('sessionId', '==', sessionId),
                where('classId', '==', session.classId),
              ),
              (fromCache) => {
                cacheStates.set('permissions', fromCache);
                emit();
              },
              onError,
            );
          }
          emit();
        },
        onError,
      );

      return () => {
        stopSession();
        stopAttendance?.();
        stopPermissions?.();
      };
    },

    async listRecap(sessionId: string): Promise<PracticumRecapEntry[]> {
      const sessionSnapshot = await getDoc(doc(sessions, sessionId));
      if (!sessionSnapshot.exists())
        throw new PracticumError('NOT_FOUND', 'Sesi praktikum tidak ditemukan.');
      const session = toSession(sessionSnapshot);
      const [participants, attendance, permissionsList] = await Promise.all([
        participantsByIds(session.classId, session.studentIds),
        listAttendanceForSession(session),
        listPermissionsForSession(session),
      ]);
      const attendanceByUser = new Map(attendance.map((item) => [item.userId, item]));
      const permissionByUser = new Map(permissionsList.map((item) => [item.userId, item]));
      return participants.map((participant) => {
        const attendanceRecord = attendanceByUser.get(participant.userId) ?? null;
        const permission = permissionByUser.get(participant.userId) ?? null;
        return {
          participant,
          attendance: attendanceRecord,
          permission,
          status: deriveRecapStatus(attendanceRecord, permission, session.status),
        };
      });
    },

    async recordAttendance(
      sessionId: string,
      userId: string,
      location: { latitude: number; longitude: number; accuracy: number | null },
    ): Promise<string> {
      if (
        !location
        || !Number.isFinite(location.latitude)
        || !Number.isFinite(location.longitude)
      ) {
        throw new PracticumError(
          'INVALID_INPUT',
          'Koordinat perangkat belum tersedia. Presensi tidak dapat dicatat.',
        );
      }

      const sessionRef = doc(sessions, sessionId);
      const sessionSnapshotForLocation = await getDoc(sessionRef);
      if (!sessionSnapshotForLocation.exists())
        throw new PracticumError('NOT_FOUND', 'Sesi praktikum tidak ditemukan.');
      const sessionForLocation = toSession(sessionSnapshotForLocation);
      const scheduleSnapshot = await getDoc(doc(schedules, sessionForLocation.scheduleId));
      if (!scheduleSnapshot.exists())
        throw new PracticumError('NOT_FOUND', 'Lokasi laboratorium sesi tidak ditemukan.');
      const schedule = toSchedule(scheduleSnapshot);
      const labSnapshot = await getDocs(
        query(collection(db, 'labLocations'), where('name', '==', schedule.location), limit(1)),
      );
      if (labSnapshot.empty)
        throw new PracticumError(
          'INVALID_INPUT',
          'Lokasi laboratorium sesi belum tersedia. Presensi tidak dapat dicatat.',
        );
      const labData = labSnapshot.docs[0].data();
      if (
        typeof labData.latitude !== 'number'
        || typeof labData.longitude !== 'number'
        || typeof labData.radiusMeters !== 'number'
      ) {
        throw new PracticumError(
          'INVALID_INPUT',
          'Koordinat atau radius laboratorium tidak valid.',
        );
      }

      const distanceMeters = calculateDistanceMeters(
        { latitude: location.latitude, longitude: location.longitude },
        { latitude: labData.latitude, longitude: labData.longitude },
      );
      if (distanceMeters > labData.radiusMeters) {
        throw new PracticumError(
          'INVALID_INPUT',
          `Kamu berada di luar radius laboratorium (${Math.round(distanceMeters)} m; batas ${labData.radiusMeters} m).`,
        );
      }

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
        const now = Timestamp.now().toMillis();
        if (now < session.startAt.toMillis() || now > session.endAt.toMillis())
          throw new PracticumError(
            'SESSION_NOT_OPEN',
            'Presensi hanya dapat dilakukan dalam rentang waktu kelas.',
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

        const permission = await transaction.get(doc(permissions, attendanceId(sessionId, userId)));
        if (permission.exists() && ['pending', 'approved'].includes(permission.data().status))
          throw new PracticumError(
            'INVALID_TRANSITION',
            'Kamu memiliki izin menunggu atau disetujui. Periksa status izin terlebih dahulu.',
          );

        transaction.set(ref, {
          sessionId,
          classId: session.classId,
          userId,
          status: 'present',
          recordedAt: serverTimestamp(),
          latitude: location.latitude,
          longitude: location.longitude,
          accuracyMeters: typeof location.accuracy === 'number' ? location.accuracy : null,
          distanceMeters: Math.round(distanceMeters * 10) / 10,
          allowedRadiusMeters: labData.radiusMeters,
          locationValidated: true,
          labName: schedule.location,
        });
        return ref.id;
      });
    },
  };
}

export type PracticumRepository = ReturnType<typeof createPracticumRepository>;
