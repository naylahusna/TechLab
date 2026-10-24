import assert from 'node:assert/strict';
import test from 'node:test';

import { createInitialDemoState } from '../src/core/demo-data';
import { transitionDemo, type DemoAction } from '../src/core/demo-state';
import { createDemoStore, type DemoStore } from '../src/core/demo-store';
import { validateAttendance, validateSessionAction } from '../src/core/rules';
import {
  selectAttendanceRecord,
  selectAttendanceSummary,
  selectMyAttendance,
  selectMySession,
  selectSessionParticipants,
} from '../src/core/selectors';
import type { ActionErrorCode, ActionResult } from '../src/core/types';

const recordedAt = '2026-10-26T01:04:05.000Z';
const makeStore = () => createDemoStore({ now: () => recordedAt });

function expectRejection(store: DemoStore, action: () => ActionResult, code: ActionErrorCode) {
  const before = store.getSnapshot();
  const result = action();
  assert.equal(result.ok, false);
  if (result.ok) assert.fail('Expected an invalid action to fail');
  assert.equal(result.code, code);
  assert.ok(result.message.length > 0);
  assert.equal(store.getSnapshot(), before);
}

test('complete demo shares a session and exact attendance time through repeated identity switches', () => {
  const store = makeStore();
  assert.equal(store.actions.selectUser('asisten-01', 'asisten'), true);
  const initial = store.getSnapshot();
  assert.equal(store.actions.openSession('sesi-01').ok, true);
  assert.equal(selectMySession(store.getSnapshot(), 'sesi-01')?.status, 'open');
  assert.equal(initial.sessions.find((session) => session.id === 'sesi-01')?.status, 'upcoming');

  store.actions.selectUser('praktikan-01');
  assert.equal(selectMySession(store.getSnapshot(), 'sesi-01')?.status, 'open');
  assert.equal(validateAttendance(store.getSnapshot(), 'sesi-01', 'praktikan-01').ok, true);
  assert.equal(store.actions.recordAttendance('sesi-01', 'praktikan-01').ok, true);
  const record = selectAttendanceRecord(store.getSnapshot(), 'sesi-01', 'praktikan-01');
  assert.equal(record?.recordedAt, recordedAt);

  store.actions.selectUser('asisten-01');
  const roster = selectSessionParticipants(store.getSnapshot(), 'sesi-01');
  assert.equal(roster.find((entry) => entry.student.id === 'praktikan-01')?.record, record);
  assert.equal(roster.filter((entry) => entry.status === 'present').length, 1);
  assert.equal(roster.filter((entry) => entry.status === 'pending').length, 1);
  assert.deepEqual(selectAttendanceSummary(store.getSnapshot(), 'sesi-01'), {
    total: 2,
    present: 1,
    notPresent: 1,
  });
  assert.equal(store.actions.closeSession('sesi-01').ok, true);
  assert.equal(
    selectSessionParticipants(store.getSnapshot(), 'sesi-01').find(
      (entry) => entry.student.id === 'praktikan-02',
    )?.status,
    'absent',
  );

  store.actions.selectUser('praktikan-01');
  assert.equal(selectMySession(store.getSnapshot(), 'sesi-01')?.status, 'closed');
  assert.equal(selectAttendanceRecord(store.getSnapshot(), 'sesi-01', 'praktikan-01'), record);
  expectRejection(
    store,
    () => store.actions.recordAttendance('sesi-01', 'praktikan-01'),
    'ALREADY_PRESENT',
  );
  store.actions.selectUser('praktikan-02');
  expectRejection(
    store,
    () => store.actions.recordAttendance('sesi-01', 'praktikan-02'),
    'SESSION_NOT_OPEN',
  );
  assert.equal(
    selectMyAttendance(store.getSnapshot()).find((entry) => entry.session.id === 'sesi-01')?.status,
    'absent',
  );
  store.actions.selectUser('asisten-01');
  expectRejection(store, () => store.actions.openSession('sesi-01'), 'INVALID_SESSION_TRANSITION');
});

test('attendance rejects assistants, another identity, unenrolled students, and unopened sessions', () => {
  const store = makeStore();
  store.actions.selectUser('asisten-01');
  expectRejection(
    store,
    () => store.actions.recordAttendance('sesi-02', 'praktikan-01'),
    'STUDENT_REQUIRED',
  );
  store.actions.selectUser('praktikan-01');
  expectRejection(
    store,
    () => store.actions.recordAttendance('sesi-02', 'praktikan-02'),
    'IDENTITY_MISMATCH',
  );
  expectRejection(
    store,
    () => store.actions.recordAttendance('sesi-01', 'praktikan-01'),
    'SESSION_NOT_OPEN',
  );
  store.actions.selectUser('praktikan-03');
  expectRejection(
    store,
    () => store.actions.recordAttendance('sesi-02', 'praktikan-03'),
    'NOT_ENROLLED',
  );
  store.actions.selectUser('praktikan-02');
  expectRejection(
    store,
    () => store.actions.recordAttendance('sesi-03', 'praktikan-02'),
    'SESSION_NOT_OPEN',
  );
});

test('rapid repeated calls, existing dummy records, and return visits never duplicate attendance', () => {
  const store = makeStore();
  store.actions.selectUser('praktikan-01');
  const { recordAttendance } = store.actions;
  assert.equal(recordAttendance('sesi-02', 'praktikan-01').ok, true);
  const afterFirst = store.getSnapshot();
  for (let attempt = 0; attempt < 25; attempt++) {
    expectRejection(store, () => recordAttendance('sesi-02', 'praktikan-01'), 'ALREADY_PRESENT');
  }
  store.actions.selectUser('asisten-01');
  store.actions.selectUser('praktikan-01');
  expectRejection(store, () => recordAttendance('sesi-02', 'praktikan-01'), 'ALREADY_PRESENT');
  assert.equal(store.getSnapshot().attendanceRecords, afterFirst.attendanceRecords);
  assert.equal(
    store
      .getSnapshot()
      .attendanceRecords.filter(
        (item) => item.sessionId === 'sesi-02' && item.studentId === 'praktikan-01',
      ).length,
    1,
  );
  store.actions.selectUser('praktikan-02');
  expectRejection(store, () => recordAttendance('sesi-02', 'praktikan-02'), 'ALREADY_PRESENT');
});

test('different students and sessions have independent attendance keys', () => {
  const store = makeStore();
  store.actions.selectUser('asisten-01');
  store.actions.openSession('sesi-01');
  store.actions.selectUser('praktikan-01');
  assert.equal(store.actions.recordAttendance('sesi-01', 'praktikan-01').ok, true);
  assert.equal(store.actions.recordAttendance('sesi-02', 'praktikan-01').ok, true);
  store.actions.selectUser('praktikan-02');
  assert.equal(store.actions.recordAttendance('sesi-01', 'praktikan-02').ok, true);
  const keys = store.getSnapshot().attendanceRecords.map((record) => record.id);
  assert.equal(new Set(keys).size, keys.length);
});

test('callbacks captured before an identity change or closure still validate the newest state', () => {
  const store = makeStore();
  store.actions.selectUser('praktikan-01');
  const { recordAttendance, openSession } = store.actions;
  assert.equal(validateAttendance(store.getSnapshot(), 'sesi-02', 'praktikan-01').ok, true);
  store.actions.selectUser('asisten-01');
  expectRejection(store, () => recordAttendance('sesi-02', 'praktikan-01'), 'STUDENT_REQUIRED');
  store.actions.closeSession('sesi-02');
  store.actions.selectUser('praktikan-01');
  expectRejection(store, () => recordAttendance('sesi-02', 'praktikan-01'), 'SESSION_NOT_OPEN');
  expectRejection(store, () => openSession('sesi-01'), 'ASSISTANT_REQUIRED');
});

test('invalid time, an inconsistent actor, and unknown commands cannot change state', () => {
  const store = createDemoStore({ now: () => 'not-a-date' });
  store.actions.selectUser('praktikan-01');
  expectRejection(
    store,
    () => store.actions.recordAttendance('sesi-02', 'praktikan-01'),
    'INVALID_TIME',
  );
  const state = store.getSnapshot();
  const invalidActor = { ...state, currentRole: 'asisten' as const };
  assert.equal(validateAttendance(invalidActor, 'sesi-02', 'praktikan-01').ok, false);
  assert.equal(validateSessionAction(invalidActor, 'sesi-01', 'open').ok, false);
  const unknown = transitionDemo(state, { type: 'unknown' } as unknown as DemoAction);
  assert.equal(unknown.state, state);
  assert.equal(unknown.result.ok, false);
});

test('identity switches preserve data references; reset and a fresh app restore seed data', () => {
  const store = makeStore();
  store.actions.selectUser('praktikan-01');
  store.actions.recordAttendance('sesi-02', 'praktikan-01');
  const changed = store.getSnapshot();
  store.actions.selectUser('asisten-01');
  assert.equal(store.getSnapshot().sessions, changed.sessions);
  assert.equal(store.getSnapshot().attendanceRecords, changed.attendanceRecords);
  assert.equal(store.actions.openSession('sesi-01').ok, true);
  assert.equal(store.actions.closeSession('sesi-01').ok, true);
  const freshApp = makeStore();
  assert.deepEqual(freshApp.getSnapshot(), createInitialDemoState());
  assert.equal(store.actions.resetDemo().ok, true);
  assert.deepEqual(store.getSnapshot(), createInitialDemoState());
  assert.equal(store.getSnapshot().currentUserId, null);
  assert.equal(selectAttendanceRecord(changed, 'sesi-02', 'praktikan-01')?.recordedAt, recordedAt);
});

test('attendance writes require a selected user and an existing session', () => {
  const store = makeStore();
  expectRejection(
    store,
    () => store.actions.recordAttendance('sesi-02', 'praktikan-01'),
    'USER_REQUIRED',
  );
  store.actions.selectUser('praktikan-01');
  expectRejection(
    store,
    () => store.actions.recordAttendance('missing', 'praktikan-01'),
    'SESSION_NOT_FOUND',
  );
});

test('an attendance write notifies once and its immutable record survives repeated attempts', () => {
  const store = makeStore();
  store.actions.selectUser('praktikan-01');
  let notifications = 0;
  const stop = store.subscribe(() => {
    notifications++;
  });
  assert.equal(store.actions.recordAttendance('sesi-02', 'praktikan-01').ok, true);
  const snapshot = store.getSnapshot();
  const record = selectAttendanceRecord(snapshot, 'sesi-02', 'praktikan-01');
  assert.equal(notifications, 1);
  assert.ok(Object.isFrozen(snapshot));
  assert.ok(Object.isFrozen(snapshot.attendanceRecords));
  assert.ok(Object.isFrozen(record));
  expectRejection(
    store,
    () => store.actions.recordAttendance('sesi-02', 'praktikan-01'),
    'ALREADY_PRESENT',
  );
  assert.equal(notifications, 1);
  assert.equal(selectAttendanceRecord(store.getSnapshot(), 'sesi-02', 'praktikan-01'), record);
  stop();
});
