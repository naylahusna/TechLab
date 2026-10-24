import assert from 'node:assert/strict';
import test from 'node:test';

import { createInitialDemoState } from '../src/core/demo-data';
import { createDemoStore } from '../src/core/demo-store';
import {
  selectAttendanceRecord,
  selectMyAttendance,
  selectMySessions,
} from '../src/core/selectors';
import {
  formatTimeLabel,
  mapAttendanceStatus,
  mapSessionStatus,
  toSessionListItem,
} from '../src/features/practitioner/lib/argamapping';
import { getAttendanceAction } from '../src/features/practitioner/lib/attendance-action';

test('practitioner maps core statuses to view models', () => {
  assert.equal(mapSessionStatus('upcoming'), 'belum-dibuka');
  assert.equal(mapSessionStatus('open'), 'dibuka');
  assert.equal(mapSessionStatus('closed'), 'ditutup');
  assert.equal(mapAttendanceStatus('present'), 'hadir');
  assert.equal(mapAttendanceStatus('pending'), 'belum-presensi');
  assert.equal(mapAttendanceStatus('absent'), 'tidak-hadir');
});

test('practitioner builds schedule cards from core sessions', () => {
  const state = createInitialDemoState();
  const session = state.sessions.find((item) => item.id === 'sesi-02');
  assert.ok(session);

  const item = toSessionListItem(session);
  assert.equal(item.id, 'sesi-02');
  assert.equal(item.practicalName, session.practicumName);
  assert.equal(item.className, session.className);
  assert.equal(item.lab, session.lab);
  assert.equal(item.status, 'dibuka');
  assert.ok(item.dateLabel.length > 0);
  assert.match(item.timeLabel, /^\d{2}\.\d{2}$/);
});

test('attendance action follows session and attendance state', () => {
  assert.equal(getAttendanceAction('dibuka', 'belum-presensi').kind, 'available');
  assert.equal(getAttendanceAction('dibuka', 'belum-presensi').disabled, false);
  assert.equal(getAttendanceAction('dibuka', 'hadir').kind, 'already-attended');
  assert.equal(getAttendanceAction('dibuka', 'hadir').disabled, true);
  assert.equal(getAttendanceAction('belum-dibuka', 'belum-presensi').kind, 'not-open');
  assert.equal(getAttendanceAction('ditutup', 'tidak-hadir').kind, 'closed');
});

test('stored attendance record formats to a time label', () => {
  const state = createInitialDemoState();
  const record = state.attendanceRecords[0];
  assert.ok(record);
  assert.match(formatTimeLabel(record.recordedAt), /^\d{2}\.\d{2}$/);
});

test('detail and history derive the same time from the stored record', () => {
  const recordedAt = '2026-10-26T01:04:05.000Z';
  const store = createDemoStore({ now: () => recordedAt });
  assert.equal(store.actions.selectUser('praktikan-01', 'praktikan'), true);
  assert.equal(store.actions.recordAttendance('sesi-02', 'praktikan-01').ok, true);

  const state = store.getSnapshot();
  const record = selectAttendanceRecord(state, 'sesi-02', 'praktikan-01');
  assert.ok(record);
  assert.equal(record.recordedAt, recordedAt);

  const historyEntry = selectMyAttendance(state).find((entry) => entry.session.id === 'sesi-02');
  assert.ok(historyEntry?.record);
  assert.equal(formatTimeLabel(historyEntry.record.recordedAt), formatTimeLabel(record.recordedAt));
});

test('Alya can attend, Raka gets an empty state, and Bima cannot inherit Alya feedback', () => {
  const store = createDemoStore({ now: () => '2026-10-26T01:04:05.000Z' });
  assert.equal(store.actions.selectUser('praktikan-01', 'praktikan'), true);
  assert.ok(selectMySessions(store.getSnapshot()).some((session) => session.id === 'sesi-02'));
  assert.equal(store.actions.recordAttendance('sesi-02', 'praktikan-01').ok, true);
  assert.equal(
    selectMyAttendance(store.getSnapshot()).find((entry) => entry.session.id === 'sesi-02')?.status,
    'present',
  );

  assert.equal(store.actions.selectUser('praktikan-04', 'praktikan'), true);
  assert.equal(selectMySessions(store.getSnapshot()).length, 0);
  assert.equal(selectMyAttendance(store.getSnapshot()).length, 0);

  assert.equal(store.actions.selectUser('praktikan-02', 'praktikan'), true);
  assert.equal(
    selectMyAttendance(store.getSnapshot()).some(
      (entry) => entry.record?.studentId === 'praktikan-01',
    ),
    false,
  );
});
