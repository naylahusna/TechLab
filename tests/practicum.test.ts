import assert from 'node:assert/strict';
import test from 'node:test';
import { Timestamp } from 'firebase/firestore';
import {
  attendanceId,
  participantId,
  sessionIdForSchedule,
} from '../src/features/practicum/ids';
import { findScheduleConflict } from '../src/features/practicum/schedule-conflict';
import {
  toAssistantRecapItems,
  toPractitionerHistoryItems,
} from '../src/features/practicum/session-view';
import type {
  PracticumAttendance,
  PracticumClass,
  PracticumSchedule,
  PracticumSession,
} from '../src/features/practicum/types';
import {
  validateClassInput,
  validateParticipantInput,
  validateScheduleInput,
} from '../src/features/practicum/validation';

test('practicum IDs are deterministic and safe for Firestore paths', () => {
  assert.equal(participantId('class-if-a', 'praktikan-01'), 'class-if-a_praktikan-01');
  assert.equal(attendanceId('schedule-a-1', 'praktikan-01'), 'schedule-a-1_praktikan-01');
  assert.equal(sessionIdForSchedule('schedule-a-1'), 'schedule-a-1');
});

test('class validation trims fields and rejects invalid assistant lists', () => {
  assert.deepEqual(
    validateClassInput({
      className: '  Informatika A ',
      courseName: ' Pemrograman Perangkat Bergerak ',
      assistantIds: [' asisten-01 '],
    }),
    {
      className: 'Informatika A',
      courseName: 'Pemrograman Perangkat Bergerak',
      assistantIds: ['asisten-01'],
    },
  );
  assert.throws(() => validateClassInput({ className: '', courseName: 'X' }));
  assert.throws(() =>
    validateClassInput({ className: 'X', courseName: 'Y', assistantIds: [] }),
  );
  assert.throws(() =>
    validateClassInput({
      className: 'X',
      courseName: 'Y',
      assistantIds: Array.from({ length: 21 }, (_, index) => `asisten-${index}`),
    }),
  );
});

test('participant validation rejects malformed user IDs and student numbers', () => {
  assert.deepEqual(
    validateParticipantInput({
      classId: 'class-if-a',
      userId: 'praktikan-01',
      studentName: ' Alya Putri ',
      studentNumber: ' 240101001 ',
    }),
    {
      classId: 'class-if-a',
      userId: 'praktikan-01',
      studentName: 'Alya Putri',
      studentNumber: '240101001',
    },
  );
  assert.throws(() =>
    validateParticipantInput({
      classId: 'class-if-a',
      userId: '',
      studentName: 'Alya Putri',
      studentNumber: '240101001',
    }),
  );
  assert.throws(() =>
    validateParticipantInput({
      classId: 'class-if-a',
      userId: 'praktikan-01',
      studentName: 'A',
      studentNumber: '240101001',
    }),
  );
  assert.throws(() =>
    validateParticipantInput({
      classId: 'class-if-a',
      userId: 'praktikan-01',
      studentName: 'Alya Putri',
      studentNumber: '240 101',
    }),
  );
});

test('schedule validation enforces a valid time range', () => {
  const startAt = new Date('2026-11-16T08:00:00+07:00');
  const endAt = new Date('2026-11-16T10:00:00+07:00');
  assert.deepEqual(
    validateScheduleInput({
      classId: 'class-if-a',
      title: ' Pertemuan 5 ',
      startAt,
      endAt,
      location: ' Lab Komputasi 1 ',
    }),
    {
      classId: 'class-if-a',
      title: 'Pertemuan 5',
      startAt,
      endAt,
      location: 'Lab Komputasi 1',
    },
  );
  assert.throws(() =>
    validateScheduleInput({
      classId: 'class-if-a',
      title: 'Pertemuan 5',
      startAt: endAt,
      endAt: startAt,
      location: 'Lab',
    }),
  );
  assert.throws(() =>
    validateScheduleInput({
      classId: 'class-if-a',
      title: '',
      startAt,
      endAt,
      location: 'Lab',
    }),
  );
});

function at(iso: string): Timestamp {
  return Timestamp.fromDate(new Date(iso));
}

function recapFixture() {
  const classItem: PracticumClass = {
    id: 'class-1',
    className: 'Informatika A',
    courseName: 'Pemrograman Perangkat Bergerak',
    assistantIds: ['asisten-1'],
    studentIds: ['praktikan-1', 'praktikan-2'],
    memberIds: ['asisten-1', 'praktikan-1', 'praktikan-2'],
    createdAt: at('2026-11-01T00:00:00+07:00'),
    updatedAt: at('2026-11-01T00:00:00+07:00'),
    archivedAt: null,
  };
  const schedules: PracticumSchedule[] = [1, 2, 3].map((index) => ({
    id: `schedule-${index}`,
    classId: 'class-1',
    title: `Pertemuan ${index}`,
    startAt: at(`2026-11-${String(index * 7 + 9).padStart(2, '0')}T08:00:00+07:00`),
    endAt: at(`2026-11-${String(index * 7 + 9).padStart(2, '0')}T10:00:00+07:00`),
    location: 'Lab Komputasi 1',
    createdAt: at('2026-11-01T00:00:00+07:00'),
    updatedAt: at('2026-11-01T00:00:00+07:00'),
    archivedAt: null,
  }));
  const sessions: PracticumSession[] = [
    {
      id: 'schedule-1',
      scheduleId: 'schedule-1',
      classId: 'class-1',
      studentIds: ['praktikan-1', 'praktikan-2'],
      startAt: schedules[0].startAt,
      endAt: schedules[0].endAt,
      status: 'closed',
      openedAt: at('2026-11-16T08:00:00+07:00'),
      closedAt: at('2026-11-16T10:00:00+07:00'),
      cancelledAt: null,
      openedBy: 'asisten-1',
      closedBy: 'asisten-1',
      cancelledBy: null,
      createdBy: 'asisten-1',
      createdAt: at('2026-11-01T00:00:00+07:00'),
      updatedAt: at('2026-11-16T10:00:00+07:00'),
    },
    {
      id: 'schedule-2',
      scheduleId: 'schedule-2',
      classId: 'class-1',
      studentIds: ['praktikan-1', 'praktikan-2'],
      startAt: schedules[1].startAt,
      endAt: schedules[1].endAt,
      status: 'open',
      openedAt: at('2026-11-23T08:00:00+07:00'),
      closedAt: null,
      cancelledAt: null,
      openedBy: 'asisten-1',
      closedBy: null,
      cancelledBy: null,
      createdBy: 'asisten-1',
      createdAt: at('2026-11-01T00:00:00+07:00'),
      updatedAt: at('2026-11-23T08:00:00+07:00'),
    },
    {
      id: 'schedule-3',
      scheduleId: 'schedule-3',
      classId: 'class-1',
      studentIds: ['praktikan-1', 'praktikan-2'],
      startAt: schedules[2].startAt,
      endAt: schedules[2].endAt,
      status: 'scheduled',
      openedAt: null,
      closedAt: null,
      cancelledAt: null,
      openedBy: null,
      closedBy: null,
      cancelledBy: null,
      createdBy: 'asisten-1',
      createdAt: at('2026-11-01T00:00:00+07:00'),
      updatedAt: at('2026-11-01T00:00:00+07:00'),
    },
  ];
  const attendance: PracticumAttendance = {
    id: 'schedule-1_praktikan-1',
    sessionId: 'schedule-1',
    classId: 'class-1',
    userId: 'praktikan-1',
    status: 'present',
    recordedAt: at('2026-11-16T08:05:00+07:00'),
  };
  const outsiderAttendance: PracticumAttendance = {
    ...attendance,
    id: 'schedule-1_praktikan-3',
    userId: 'praktikan-3',
  };
  return { classItem, schedules, sessions, attendance, outsiderAttendance };
}

test('assistant recap builds per-session summaries from Firestore records', () => {
  const { classItem, schedules, sessions, attendance, outsiderAttendance } =
    recapFixture();
  const items = toAssistantRecapItems(
    [classItem],
    schedules,
    sessions,
    {
      'schedule-1': [attendance, outsiderAttendance],
    },
  );

  assert.deepEqual(
    items.map((item) => item.session.id),
    ['schedule-1', 'schedule-2', 'schedule-3'],
  );
  assert.deepEqual(items[0].summary, { total: 2, present: 1, notPresent: 1 });
  assert.deepEqual(items[1].summary, { total: 2, present: 0, notPresent: 2 });
  assert.deepEqual(items[2].summary, { total: 2, present: 0, notPresent: 2 });
});

test('practitioner history shows past sessions and attended open sessions only', () => {
  const { classItem, schedules, sessions, attendance } = recapFixture();
  const history = toPractitionerHistoryItems(
    [classItem],
    schedules,
    sessions,
    { 'schedule-1': [attendance] },
    'praktikan-1',
  );

  assert.deepEqual(
    history.map((item) => item.sessionId),
    ['schedule-1'],
  );
  assert.equal(history[0].status, 'hadir');
  assert.ok(history[0].attendedAtLabel);
  assert.ok(history[0].attendedAtDateLabel);

  const attendedOpenSession = {
    ...attendance,
    id: 'schedule-2_praktikan-1',
    sessionId: 'schedule-2',
  };
  const withOpenSession = toPractitionerHistoryItems(
    [classItem],
    schedules,
    sessions,
    {
      'schedule-1': [attendance],
      'schedule-2': [attendedOpenSession],
    },
    'praktikan-1',
  );
  assert.deepEqual(
    withOpenSession.map((item) => item.sessionId),
    ['schedule-2', 'schedule-1'],
  );
  assert.equal(withOpenSession[0].status, 'hadir');

  const absentHistory = toPractitionerHistoryItems(
    [classItem],
    schedules,
    sessions,
    {},
    'praktikan-2',
  );
  assert.deepEqual(
    absentHistory.map((item) => item.sessionId),
    ['schedule-1'],
  );
  assert.equal(absentHistory[0].status, 'tidak-hadir');
});

test('recap and history skip sessions whose class is no longer readable', () => {
  const { schedules, sessions } = recapFixture();
  assert.deepEqual(toAssistantRecapItems([], schedules, sessions, {}), []);
  assert.deepEqual(
    toPractitionerHistoryItems([], schedules, sessions, {}, 'praktikan-1'),
    [],
  );
});

test('schedule conflict detects overlap in the same class only', () => {
  const { classItem, schedules } = recapFixture();
  const first = schedules[0];

  const overlapping = findScheduleConflict(schedules, {
    classId: classItem.id,
    startAt: new Date('2026-11-16T09:00:00+07:00'),
    endAt: new Date('2026-11-16T11:00:00+07:00'),
  });
  assert.equal(overlapping?.id, first.id);

  const backToBack = findScheduleConflict(schedules, {
    classId: classItem.id,
    startAt: new Date('2026-11-16T10:00:00+07:00'),
    endAt: new Date('2026-11-16T12:00:00+07:00'),
  });
  assert.equal(backToBack, null);

  const selfExcluded = findScheduleConflict(schedules, {
    classId: classItem.id,
    startAt: new Date('2026-11-16T08:00:00+07:00'),
    endAt: new Date('2026-11-16T10:00:00+07:00'),
    excludeScheduleId: first.id,
  });
  assert.equal(selfExcluded, null);

  const archived = [{ ...first, archivedAt: at('2026-11-02T00:00:00+07:00') }];
  assert.equal(
    findScheduleConflict(archived, {
      classId: classItem.id,
      startAt: new Date('2026-11-16T09:00:00+07:00'),
      endAt: new Date('2026-11-16T11:00:00+07:00'),
    }),
    null,
  );

  const otherClass = [{ ...first, classId: 'class-2' }];
  assert.equal(
    findScheduleConflict(otherClass, {
      classId: classItem.id,
      startAt: new Date('2026-11-16T09:00:00+07:00'),
      endAt: new Date('2026-11-16T11:00:00+07:00'),
    }),
    null,
  );
});
