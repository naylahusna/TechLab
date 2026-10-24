import type { AttendanceEntry, AttendanceRecord, AttendanceStatus, DemoState } from './types';

export const sessionStatusLabels = {
  upcoming: 'Belum Dibuka',
  open: 'Dibuka',
  closed: 'Ditutup',
} as const;

export const attendanceStatusLabels = {
  present: 'Hadir',
  pending: 'Belum Presensi',
  absent: 'Tidak Hadir',
} as const;

export function selectCurrentUser(state: DemoState) {
  return (
    state.users.find(
      (user) => user.id === state.currentUserId && user.role === state.currentRole,
    ) ?? null
  );
}

export function selectMySessions(state: DemoState) {
  const user = selectCurrentUser(state);
  if (!user) return [];
  return state.sessions.filter((session) =>
    user.role === 'asisten'
      ? session.assistantId === user.id
      : session.studentIds.includes(user.id),
  );
}

export function selectMySession(state: DemoState, sessionId: string) {
  return selectMySessions(state).find((session) => session.id === sessionId) ?? null;
}

export function selectAttendanceRecord(
  state: DemoState,
  sessionId: string,
  studentId: string,
): AttendanceRecord | null {
  return (
    state.attendanceRecords.find(
      (record) => record.sessionId === sessionId && record.studentId === studentId,
    ) ?? null
  );
}

function attendanceEntry(
  state: DemoState,
  sessionId: string,
  studentId: string,
): AttendanceEntry | null {
  const session = state.sessions.find((item) => item.id === sessionId);
  const student = state.users.find((user) => user.id === studentId && user.role === 'praktikan');
  if (!session || !student || !session.studentIds.includes(studentId)) return null;
  const record = selectAttendanceRecord(state, sessionId, studentId);
  const status: AttendanceStatus = record
    ? 'present'
    : session.status === 'closed'
      ? 'absent'
      : 'pending';
  return { session, student, status, record };
}

/** Includes unrecorded enrolled sessions so UI can show pending/absent correctly. */
export function selectMyAttendance(state: DemoState): readonly AttendanceEntry[] {
  const user = selectCurrentUser(state);
  if (!user || user.role !== 'praktikan') return [];
  return selectMySessions(state).flatMap((session) => {
    const entry = attendanceEntry(state, session.id, user.id);
    return entry ? [entry] : [];
  });
}

/** Only the assigned active assistant gets a participant roster. */
export function selectSessionParticipants(
  state: DemoState,
  sessionId: string,
): readonly AttendanceEntry[] {
  const user = selectCurrentUser(state);
  const session = selectMySession(state, sessionId);
  if (!user || user.role !== 'asisten' || !session) return [];
  return session.studentIds.flatMap((studentId) => {
    const entry = attendanceEntry(state, sessionId, studentId);
    return entry ? [entry] : [];
  });
}

export function selectAttendanceSummary(state: DemoState, sessionId: string) {
  if (selectCurrentUser(state)?.role !== 'asisten' || !selectMySession(state, sessionId))
    return null;
  const participants = selectSessionParticipants(state, sessionId);
  const present = participants.filter((entry) => entry.status === 'present').length;
  return { total: participants.length, present, notPresent: participants.length - present };
}
