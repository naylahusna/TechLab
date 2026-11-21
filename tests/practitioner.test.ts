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
  formatDateLabel,
  formatTimeLabel,
  mapAttendanceStatus,
  mapSessionStatus,
  toSessionListItem,
} from '../src/features/practitioner/lib/argamapping';
import { getAttendanceAction } from '../src/features/practitioner/lib/attendance-action';
import {
  calculateDistanceMeters,
  validateAttendanceLocation,
} from '../src/features/practitioner/lib/location-validation';
import {
  isPresensiDisabledByLocation,
  type DeviceLocationState,
} from '../src/features/practitioner/lib/device-location';
import {
  sortHistoryByDate,
  sortSessionsForSchedule,
} from '../src/features/practitioner/lib/session-sort';
import type { RiwayatItem, SessionListItem } from '../src/features/practitioner/types';

test('practitioner maps core statuses to view models', () => {
  assert.equal(mapSessionStatus('upcoming'), 'belum-dibuka');
  assert.equal(mapSessionStatus('open'), 'dibuka');
  assert.equal(mapSessionStatus('closed'), 'ditutup');
  assert.equal(mapAttendanceStatus('present'), 'hadir');
  assert.equal(mapAttendanceStatus('pending'), 'belum-presensi');
  assert.equal(mapAttendanceStatus('absent'), 'tidak-hadir');
});

test('attendance location calculates distance and checks laboratory radius', () => {
  const lab = {
    name: 'Lab Informatika',
    latitude: -6.9823,
    longitude: 110.4092,
    radiusMeters: 100,
  };

  assert.ok(calculateDistanceMeters(
    { latitude: lab.latitude, longitude: lab.longitude },
    { latitude: lab.latitude, longitude: lab.longitude },
  ) < 0.001);

  assert.equal(
    validateAttendanceLocation({ latitude: lab.latitude, longitude: lab.longitude }, lab).status,
    'inside',
  );
  assert.equal(
    validateAttendanceLocation({ latitude: lab.latitude + 0.01, longitude: lab.longitude }, lab).status,
    'outside',
  );
  assert.equal(validateAttendanceLocation(null, lab).status, 'unavailable');
});

test('location states preserve coordinates and disable attendance until ready', () => {
  const states: DeviceLocationState[] = [
    { status: 'loading', coordinates: null, message: 'Memuat' },
    {
      status: 'ready',
      coordinates: { latitude: -6.9823, longitude: 110.4092, accuracy: 12 },
      message: 'Siap',
    },
    { status: 'permission-denied', coordinates: null, message: 'Ditolak' },
    { status: 'services-off', coordinates: null, message: 'GPS mati' },
    { status: 'network-off', coordinates: null, message: 'Jaringan' },
    { status: 'location-unavailable', coordinates: null, message: 'Belum terbaca' },
    { status: 'native-unavailable', coordinates: null, message: 'Modul tidak tersedia' },
  ];

  assert.equal(isPresensiDisabledByLocation(states[0]), true);
  assert.equal(isPresensiDisabledByLocation(states[1]), false);
  assert.deepEqual(states[1].coordinates, {
    latitude: -6.9823,
    longitude: 110.4092,
    accuracy: 12,
  });
  for (const state of states.slice(2)) {
    assert.equal(isPresensiDisabledByLocation(state), true);
  }
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
  assert.equal(item.meetingLabel, `Pertemuan ${session.meeting}`);
  assert.ok(item.dateLabel.length > 0);
  assert.match(item.timeRangeLabel, /^\d{2}\.\d{2} - \d{2}\.\d{2}$/);
});

test('attendance action follows session and attendance state', () => {
  assert.equal(getAttendanceAction('dibuka', 'belum-presensi').kind, 'available');
  assert.equal(getAttendanceAction('dibuka', 'belum-presensi').disabled, false);
  assert.equal(getAttendanceAction('dibuka', 'hadir').kind, 'already-attended');
  assert.equal(getAttendanceAction('dibuka', 'hadir').disabled, true);
  assert.equal(getAttendanceAction('belum-dibuka', 'belum-presensi').kind, 'not-open');
  assert.equal(getAttendanceAction('ditutup', 'tidak-hadir').kind, 'closed');

  const startsAt = '2026-11-20T21:30:00+07:00';
  const endsAt = '2026-11-20T22:30:00+07:00';
  assert.equal(
    getAttendanceAction('dibuka', 'belum-presensi', startsAt, endsAt, Date.parse('2026-11-20T21:15:00+07:00')).kind,
    'outside-time',
  );
  assert.equal(
    getAttendanceAction('dibuka', 'belum-presensi', startsAt, endsAt, Date.parse('2026-11-20T21:15:00+07:00')).disabled,
    true,
  );
  assert.equal(
    getAttendanceAction('dibuka', 'belum-presensi', startsAt, endsAt, Date.parse('2026-11-20T21:45:00+07:00')).kind,
    'available',
  );
  assert.equal(
    getAttendanceAction('dibuka', 'belum-presensi', startsAt, endsAt, Date.parse('2026-11-20T22:45:00+07:00')).kind,
    'outside-time',
  );
  assert.equal(
    getAttendanceAction('ditutup', 'tidak-hadir', startsAt, endsAt, Date.parse('2026-11-20T22:45:00+07:00')).kind,
    'closed',
  );
});

test('stored attendance record formats to a time label', () => {
  const state = createInitialDemoState();
  const record = state.attendanceRecords[0];
  assert.ok(record);
  assert.match(formatTimeLabel(record.recordedAt), /^\d{2}\.\d{2}$/);
});

test('detail and history derive the same date and time from the stored record', () => {
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
  assert.equal(formatDateLabel(historyEntry.record.recordedAt), formatDateLabel(record.recordedAt));
  assert.match(formatDateLabel(record.recordedAt), /2026/);
});

const sessionItem = (id: string, status: SessionListItem['status']): SessionListItem => ({
  id,
  practicalName: 'Praktikum',
  meetingLabel: 'Pertemuan 1',
  className: 'Informatika A',
  lab: 'Lab 1',
  dateLabel: '24 Okt 2026',
  timeRangeLabel: '10.00 - 12.00',
  status,
});

const historyItem = (id: string, startsAt: string): RiwayatItem => ({
  id,
  sessionId: id,
  practicalName: 'Praktikum',
  meetingLabel: 'Pertemuan 1',
  dateLabel: '24 Okt 2026',
  startsAt,
  status: 'hadir',
  attendedAtLabel: '10.00',
  attendedAtDateLabel: '24 Okt 2026',
});

test('schedule puts open sessions before upcoming and closed', () => {
  const sorted = sortSessionsForSchedule([
    sessionItem('closed', 'ditutup'),
    sessionItem('upcoming', 'belum-dibuka'),
    sessionItem('open', 'dibuka'),
  ]);

  assert.deepEqual(
    sorted.map((item) => item.id),
    ['open', 'upcoming', 'closed'],
  );
});

test('history shows the newest session first', () => {
  const sorted = sortHistoryByDate([
    historyItem('old', '2026-10-20T08:00:00+07:00'),
    historyItem('new', '2026-10-24T10:00:00+07:00'),
  ]);

  assert.deepEqual(
    sorted.map((item) => item.id),
    ['new', 'old'],
  );
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
