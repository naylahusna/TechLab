import type { Timestamp } from 'firebase/firestore';

/** Status sesi Sprint 2. Berbeda dari status prototipe Sprint 1. */
export type PracticumSessionStatus = 'scheduled' | 'open' | 'closed' | 'cancelled';

export type PracticumClass = Readonly<{
  id: string;
  className: string;
  courseName: string;
  assistantIds: readonly string[];
  /** Daftar UID peserta aktif; diperbarui saat participant ditambah/dihapus. */
  studentIds: readonly string[];
  /** Gabungan asisten dan peserta untuk query/rule list yang aman. */
  memberIds: readonly string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  archivedAt: Timestamp | null;
}>;

export type PracticumParticipant = Readonly<{
  id: string;
  classId: string;
  userId: string;
  studentNumber: string;
  joinedAt: Timestamp;
  leftAt: Timestamp | null;
}>;

export type PracticumSchedule = Readonly<{
  id: string;
  classId: string;
  title: string;
  startAt: Timestamp;
  endAt: Timestamp;
  location: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  archivedAt: Timestamp | null;
}>;

export type PracticumSession = Readonly<{
  id: string;
  scheduleId: string;
  classId: string;
  /** Snapshot peserta saat sesi dibuat, agar rekap historis tetap utuh. */
  studentIds: readonly string[];
  startAt: Timestamp;
  endAt: Timestamp;
  status: PracticumSessionStatus;
  openedAt: Timestamp | null;
  closedAt: Timestamp | null;
  cancelledAt: Timestamp | null;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}>;

/**
 * Hanya presensi fisik yang disimpan. Status izin/absen/pending diturunkan
 * saat rekap, bukan ditulis ke collection attendances.
 */
export type PracticumAttendance = Readonly<{
  id: string;
  sessionId: string;
  classId: string;
  userId: string;
  status: 'present';
  recordedAt: Timestamp;
}>;

export type PracticumClassInput = Readonly<{
  className: string;
  courseName: string;
  assistantIds?: readonly string[];
}>;

export type PracticumParticipantInput = Readonly<{
  classId: string;
  userId: string;
  studentNumber: string;
}>;

export type PracticumScheduleInput = Readonly<{
  classId: string;
  title: string;
  startAt: Date;
  endAt: Date;
  location: string;
}>;

export type PracticumErrorCode =
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'INVALID_INPUT'
  | 'INVALID_TIME'
  | 'INVALID_TRANSITION'
  | 'SESSION_NOT_OPEN'
  | 'ALREADY_PRESENT'
  | 'NOT_ENROLLED'
  | 'DUPLICATE';

export type PracticumActionResult =
  | Readonly<{ ok: true; message: string }>
  | Readonly<{ ok: false; code: PracticumErrorCode; message: string }>;
