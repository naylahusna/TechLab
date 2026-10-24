/** Stable feature integration API. Screens should import from this module. */
export { useDemo } from './demo-context';
export { validateAttendance, validateSessionAction } from './rules';
export {
  attendanceStatusLabels,
  sessionStatusLabels,
  selectAttendanceRecord,
  selectAttendanceSummary,
  selectCurrentUser,
  selectMyAttendance,
  selectMySession,
  selectMySessions,
  selectSessionParticipants,
} from './selectors';
export type {
  ActionErrorCode,
  ActionResult,
  AttendanceEntry,
  AttendanceRecord,
  AttendanceStatus,
  DemoState,
  DemoUser,
  Role,
  Session,
  SessionStatus,
} from './types';
