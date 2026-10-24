import type { IdentityState } from './identity-state';
import type { DemoUser } from './users';

export type { Role } from './roles';
export type { DemoUser } from './users';

export type SessionStatus = 'upcoming' | 'open' | 'closed';
export type AttendanceStatus = 'present' | 'pending' | 'absent';

export type Session = Readonly<{
  id: string;
  practicumName: string;
  meeting: number;
  className: string;
  lab: string;
  startsAt: string;
  endsAt: string;
  status: SessionStatus;
  assistantId: string;
  studentIds: readonly string[];
}>;

export type AttendanceRecord = Readonly<{
  id: string;
  sessionId: string;
  studentId: string;
  recordedAt: string;
}>;

export type DemoState = Readonly<
  IdentityState & {
    users: readonly DemoUser[];
    sessions: readonly Session[];
    attendanceRecords: readonly AttendanceRecord[];
  }
>;

export type ActionErrorCode =
  | 'INVALID_USER'
  | 'ROLE_MISMATCH'
  | 'USER_REQUIRED'
  | 'SESSION_NOT_FOUND'
  | 'ASSISTANT_REQUIRED'
  | 'NOT_ASSIGNED'
  | 'INVALID_SESSION_TRANSITION'
  | 'STUDENT_REQUIRED'
  | 'IDENTITY_MISMATCH'
  | 'NOT_ENROLLED'
  | 'SESSION_NOT_OPEN'
  | 'ALREADY_PRESENT'
  | 'INVALID_TIME'
  | 'INVALID_ACTION';

export type ActionResult =
  | Readonly<{ ok: true; message: string }>
  | Readonly<{ ok: false; code: ActionErrorCode; message: string }>;

export type AttendanceEntry = Readonly<{
  session: Session;
  student: DemoUser;
  status: AttendanceStatus;
  record: AttendanceRecord | null;
}>;
