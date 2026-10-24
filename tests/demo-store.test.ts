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
  selectMySessions,
  selectSessionParticipants,
} from '../src/core/selectors';
import type { ActionErrorCode, ActionResult, Role } from '../src/core/types';

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

test('unselected users cannot open, close, or record attendance', () => {
  const store = makeStore();
  expectRejection(store, () => store.actions.openSession('sesi-01'), 'USER_REQUIRED');
  expectRejection(store, () => store.actions.closeSession('sesi-02'), 'USER_REQUIRED');
  expectRejection(
    store,
    () => store.actions.recordAttendance('sesi-02', 'praktikan-01'),
    'USER_REQUIRED',
  );
  assert.deepEqual(selectMySessions(store.getSnapshot()), []);
  assert.deepEqual(selectMyAttendance(store.getSnapshot()), []);
});

test('selectUser keeps boolean compatibility and rejects unknown users and mismatched roles', () => {
  const store = makeStore();
  assert.equal(store.actions.selectUser('praktikan-01'), true);
  const before = store.getSnapshot();
  for (const [id, role] of [
    ['unknown', 'praktikan'],
    ['asisten-01', 'praktikan'],
    ['praktikan-01', 'admin' as Role],
    ['praktikan-01', null as unknown as Role],
  ] as const) {
    assert.equal(store.actions.selectUser(id, role), false);
    assert.equal(store.getSnapshot(), before);
  }
  assert.equal(store.actions.selectUser('praktikan-01', 'praktikan'), true);
  assert.equal(store.getSnapshot(), before);
});

test('only the assigned assistant may manage a session', () => {
  const store = makeStore();
  store.actions.selectUser('praktikan-01');
  expectRejection(store, () => store.actions.openSession('sesi-01'), 'ASSISTANT_REQUIRED');
  expectRejection(store, () => store.actions.closeSession('sesi-02'), 'ASSISTANT_REQUIRED');
  store.actions.selectUser('asisten-02');
  expectRejection(store, () => store.actions.openSession('sesi-01'), 'NOT_ASSIGNED');
  expectRejection(store, () => store.actions.closeSession('sesi-02'), 'NOT_ASSIGNED');
  assert.equal(store.actions.openSession('sesi-04').ok, true);
});

test('unknown sessions are rejected for all session mutations', () => {
  const store = makeStore();
  store.actions.selectUser('asisten-01');
  expectRejection(store, () => store.actions.openSession('missing'), 'SESSION_NOT_FOUND');
  expectRejection(store, () => store.actions.closeSession('missing'), 'SESSION_NOT_FOUND');
  store.actions.selectUser('praktikan-01');
  expectRejection(
    store,
    () => store.actions.recordAttendance('missing', 'praktikan-01'),
    'SESSION_NOT_FOUND',
  );
});

test('session transitions cannot skip, repeat, or reopen a closed session', () => {
  const store = makeStore();
  store.actions.selectUser('asisten-01');
  expectRejection(store, () => store.actions.closeSession('sesi-01'), 'INVALID_SESSION_TRANSITION');
  expectRejection(store, () => store.actions.openSession('sesi-02'), 'INVALID_SESSION_TRANSITION');
  expectRejection(store, () => store.actions.openSession('sesi-03'), 'INVALID_SESSION_TRANSITION');
  expectRejection(store, () => store.actions.closeSession('sesi-03'), 'INVALID_SESSION_TRANSITION');
  assert.equal(store.actions.openSession('sesi-01').ok, true);
  expectRejection(store, () => store.actions.openSession('sesi-01'), 'INVALID_SESSION_TRANSITION');
  assert.equal(store.actions.closeSession('sesi-01').ok, true);
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

test('subscribers see committed snapshots once and rejected actions do not notify them', () => {
  const store = makeStore();
  const snapshots: ReturnType<typeof store.getSnapshot>[] = [];
  const unsubscribe = store.subscribe(() => snapshots.push(store.getSnapshot()));
  assert.equal(store.getSnapshot(), store.getSnapshot());
  store.actions.selectUser('asisten-01');
  store.actions.openSession('sesi-01');
  store.actions.openSession('sesi-01');
  store.actions.selectUser('asisten-01');
  store.actions.selectUser('missing');
  assert.equal(snapshots.length, 2);
  assert.equal(snapshots[1], store.getSnapshot());
  unsubscribe();
  store.actions.closeSession('sesi-01');
  assert.equal(snapshots.length, 2);
});

test('selectors isolate role-specific schedules, personal entries, roster, and summary', () => {
  const store = makeStore();
  store.actions.selectUser('praktikan-01');
  const history = selectMyAttendance(store.getSnapshot());
  assert.ok(history.every((entry) => entry.student.id === 'praktikan-01'));
  assert.equal(history.find((entry) => entry.session.id === 'sesi-01')?.status, 'pending');
  assert.equal(history.find((entry) => entry.session.id === 'sesi-03')?.status, 'present');
  assert.equal(selectMySession(store.getSnapshot(), 'sesi-04'), null);
  assert.deepEqual(selectSessionParticipants(store.getSnapshot(), 'sesi-02'), []);
  assert.equal(selectAttendanceSummary(store.getSnapshot(), 'sesi-02'), null);
  store.actions.selectUser('asisten-01');
  assert.deepEqual(selectMyAttendance(store.getSnapshot()), []);
  assert.deepEqual(selectSessionParticipants(store.getSnapshot(), 'sesi-04'), []);
  assert.equal(selectAttendanceSummary(store.getSnapshot(), 'sesi-04'), null);
  store.actions.selectUser('asisten-02');
  assert.deepEqual(selectAttendanceSummary(store.getSnapshot(), 'sesi-05'), {
    total: 0,
    present: 0,
    notPresent: 0,
  });
});
