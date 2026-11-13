import assert from 'node:assert/strict';
import test from 'node:test';
import {
  attendanceId,
  participantId,
  sessionIdForSchedule,
} from '../src/features/practicum/ids';
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
      studentNumber: ' 240101001 ',
    }),
    {
      classId: 'class-if-a',
      userId: 'praktikan-01',
      studentNumber: '240101001',
    },
  );
  assert.throws(() =>
    validateParticipantInput({ classId: 'class-if-a', userId: '', studentNumber: '240101001' }),
  );
  assert.throws(() =>
    validateParticipantInput({
      classId: 'class-if-a',
      userId: 'praktikan-01',
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
