import type { PracticumClass, PracticumSchedule, PracticumSession } from '../practicum/types';

export type LabActivityData = {
  classes: PracticumClass[];
  schedules: PracticumSchedule[];
  sessions: PracticumSession[];
};

export type LabActivity = {
  schedule: PracticumSchedule;
  course: PracticumClass;
  status: PracticumSession['status'];
};

export function findLabActivity(data: LabActivityData, labName: string, now: number) {
  const normalizedName = labName.trim().toLocaleLowerCase('id');
  const classes = new Map(data.classes.filter((item) => !item.archivedAt).map((item) => [item.id, item]));
  const sessions = new Map(data.sessions.map((item) => [item.scheduleId, item]));
  const activities = data.schedules.flatMap((schedule): LabActivity[] => {
    const course = classes.get(schedule.classId);
    if (!course || schedule.archivedAt || schedule.location.trim().toLocaleLowerCase('id') !== normalizedName) return [];
    const session = sessions.get(schedule.id);
    const status = session?.classId === schedule.classId ? session.status : 'scheduled';
    return status === 'cancelled' || status === 'closed' ? [] : [{ schedule, course, status }];
  }).sort((a, b) => a.schedule.startAt.toMillis() - b.schedule.startAt.toMillis());

  const ongoing = activities.find(({ status, schedule }) => status === 'open' && now < schedule.endAt.toMillis())
    ?? activities.find(({ schedule }) => schedule.startAt.toMillis() <= now && now < schedule.endAt.toMillis());
  const upcoming = activities.find(({ schedule, status }) => status === 'scheduled' && schedule.startAt.toMillis() > now);
  return { ongoing, upcoming };
}
