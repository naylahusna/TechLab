import assert from 'node:assert/strict';
import test from 'node:test';
import { Timestamp } from 'firebase/firestore';

import { findLabActivity, type LabActivityData } from '../src/features/maps/lab-activity';
import type { PracticumSchedule, PracticumSession } from '../src/features/practicum/types';

const at = (minutes: number) => Timestamp.fromMillis(minutes * 60000);
function schedule(id: string, start: number, end: number, overrides: Partial<PracticumSchedule> = {}): PracticumSchedule {
  return {
    id, classId: 'class-a', title: id, startAt: at(start), endAt: at(end),
    location: 'Lab Informatika B', createdAt: at(0), updatedAt: at(0), archivedAt: null,
    ...overrides,
  };
}
function session(item: PracticumSchedule, status: PracticumSession['status']): PracticumSession {
  return {
    id: item.id, scheduleId: item.id, classId: item.classId, studentIds: [],
    startAt: item.startAt, endAt: item.endAt, status, openedAt: null, closedAt: null, cancelledAt: null,
    openedBy: null, closedBy: null, cancelledBy: null, createdBy: 'asisten', createdAt: at(0), updatedAt: at(0),
  };
}

const course = {
  id: 'class-a', className: 'A', courseName: 'PPK', assistantIds: [], studentIds: [], memberIds: [],
  createdAt: at(0), updatedAt: at(0), archivedAt: null,
};

test('selects current and nearest upcoming activities by lab name and preserves session status', () => {
  const current = schedule('current', 5, 15);
  const next = schedule('next', 20, 30);
  const data: LabActivityData = {
    classes: [course],
    schedules: [schedule('later', 35, 45), next, current, schedule('next door', 1, 19, { location: 'Lab Informatika C' })],
    sessions: [session(current, 'open')],
  };
  const result = findLabActivity(data, '  LAB INFORMATIKA B ', at(10).toMillis());
  assert.equal(result.ongoing?.schedule.id, 'current');
  assert.equal(result.ongoing?.course.courseName, 'PPK');
  assert.equal(result.ongoing?.status, 'open');
  assert.equal(result.upcoming?.schedule.id, 'next');
  assert.equal(result.upcoming?.status, 'scheduled');
  assert.equal(findLabActivity(data, 'Lab Informatika C', at(10).toMillis()).ongoing?.schedule.id, 'next door');
});

test('excludes inaccessible, archived, ended and cancelled activities from Maps', () => {
  const stale = schedule('stale', 1, 9);
  const closed = schedule('closed', 2, 18);
  const cancelled = schedule('cancelled', 20, 25);
  const data: LabActivityData = {
    classes: [course, { ...course, id: 'archived', archivedAt: at(0) }],
    schedules: [
      stale, closed, cancelled, schedule('archived-schedule', 15, 17, { archivedAt: at(0) }),
      schedule('archived-class', 1, 20, { classId: 'archived' }),
      schedule('private', 1, 20, { classId: 'inaccessible' }),
    ],
    sessions: [session(stale, 'open'), session(closed, 'closed'), session(cancelled, 'cancelled')],
  };
  assert.deepEqual(findLabActivity(data, stale.location, at(10).toMillis()), { ongoing: undefined, upcoming: undefined });
});
