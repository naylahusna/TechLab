export const PRACTICUM_COLLECTIONS = {
  classes: 'classes',
  participants: 'participants',
  schedules: 'schedules',
  sessions: 'sessions',
  attendances: 'attendances',
  permissions: 'permissions',
  userDirectory: 'userDirectory',
} as const;

/** Satu peserta per kelas per pengguna. */
export function participantId(classId: string, userId: string): string {
  return `${classId}_${userId}`;
}

/** Satu presensi per sesi per praktikan. */
export function attendanceId(sessionId: string, userId: string): string {
  return `${sessionId}_${userId}`;
}

/**
 * Sprint 2 memakai relasi satu jadwal = satu sesi, sehingga ID sesi sama
 * dengan ID jadwal. Aturan Security Rules ikut menegakkan hal ini.
 */
export function sessionIdForSchedule(scheduleId: string): string {
  return scheduleId;
}
