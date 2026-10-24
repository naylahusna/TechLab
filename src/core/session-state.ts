import { assistantSessions } from '../features/assistant/assistant-sessions';
import { users } from './users';

export type SessionStatus = 'Akan datang' | 'Sedang berlangsung' | 'Selesai';
export type SessionState = Readonly<Record<string, SessionStatus>>;
export type AttendanceRecord = Readonly<{ sessionId: string; studentId: string; attendedAt: string }>;

export const initialSessionState: SessionState = Object.freeze(
  Object.fromEntries(assistantSessions.map((session) => [session.id, session.status])),
);

/** Shared attendance source. Empty at startup; records are added by the attendance flow. */
export const initialAttendanceRecords: readonly AttendanceRecord[] = Object.freeze([]);

export function attendanceCounts(sessionId: string, records: readonly AttendanceRecord[]) {
  const session = assistantSessions.find((item) => item.id === sessionId);
  const roster = users.filter((user) => user.role === 'praktikan' && user.group === session?.group);
  const presentIds = new Set(records.filter((record) => record.sessionId === sessionId).map((record) => record.studentId));
  const present = roster.filter((student) => presentIds.has(student.id)).length;
  return { present, absent: roster.length - present, total: roster.length };
}

export function attendanceRoster(sessionId: string, records: readonly AttendanceRecord[]) {
  const session = assistantSessions.find((item) => item.id === sessionId);
  const roster = users.filter((user) => user.role === 'praktikan' && user.group === session?.group);
  return roster.map((student) => {
    const record = records.find((item) => item.sessionId === sessionId && item.studentId === student.id);
    return { student, attendedAt: record?.attendedAt ?? null };
  });
}

/** Open a scheduled session once; an open or completed session cannot be reopened. */
export function openSession(state: SessionState, sessionId: string): SessionState {
  if (!Object.hasOwn(state, sessionId) || state[sessionId] !== 'Akan datang') return state;
  return { ...state, [sessionId]: 'Sedang berlangsung' };
}

/** Close an active session so no later attendance can be recorded. */
export function closeSession(state: SessionState, sessionId: string): SessionState {
  if (!Object.hasOwn(state, sessionId) || state[sessionId] !== 'Sedang berlangsung') return state;
  return { ...state, [sessionId]: 'Selesai' };
}
