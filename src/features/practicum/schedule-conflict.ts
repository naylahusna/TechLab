import type { PracticumSchedule } from './types';

export type ScheduleConflictInput = Readonly<{
  classId: string;
  startAt: Date;
  endAt: Date;
  /** Jadwal yang sedang diedit tidak boleh dianggap bentrok dengan dirinya sendiri. */
  excludeScheduleId?: string;
}>;

/**
 * Cari jadwal lain di kelas yang sama yang waktunya tumpang tindih.
 *
 * Aturan Sprint 2: bentrok hanya dicek per kelas, jadwal arsip diabaikan, dan
 * jadwal yang bersambung tepat di batas waktu (end == start) dianggap aman.
 */
export function findScheduleConflict(
  schedules: readonly PracticumSchedule[],
  input: ScheduleConflictInput,
): PracticumSchedule | null {
  const start = input.startAt.getTime();
  const end = input.endAt.getTime();

  return (
    schedules.find((schedule) => {
      if (schedule.classId !== input.classId) return false;
      if (schedule.archivedAt) return false;
      if (schedule.id === input.excludeScheduleId) return false;
      return schedule.startAt.toMillis() < end && schedule.endAt.toMillis() > start;
    }) ?? null
  );
}
