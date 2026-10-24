import assert from 'node:assert/strict';
import test from 'node:test';
import { createInitialDemoState } from '../src/core/demo-data';
import { createDemoStore } from '../src/core/demo-store';
import {
  selectMyAttendance,
  selectMySession,
  selectMySessions,
  selectSessionParticipants,
  selectAttendanceSummary,
} from '../src/core/selectors';
import type { Role } from '../src/core/types';

test('switching roles preserves the same sessions and attendance snapshot', () => {
  const store = createDemoStore();
  const initial = store.getSnapshot();
  for (const id of ['asisten-01', 'praktikan-01', 'praktikan-02', 'asisten-02', 'praktikan-01']) {
    assert.equal(store.actions.selectUser(id), true);
    assert.equal(store.getSnapshot().sessions, initial.sessions);
    assert.equal(store.getSnapshot().attendanceRecords, initial.attendanceRecords);
  }
  assert.equal(
    selectMyAttendance(store.getSnapshot()).find((entry) => entry.session.id === 'sesi-03')?.record
      ?.studentId,
    'praktikan-01',
  );
});

test('identity selection keeps boolean compatibility and rejects invalid choices without notifications', () => {
  const store = createDemoStore();
  assert.equal(store.actions.selectUser('praktikan-01', 'praktikan'), true);
  const before = store.getSnapshot();
  let notifications = 0;
  const stop = store.subscribe(() => {
    notifications++;
  });
  for (const [id, role] of [
    ['missing', 'praktikan'],
    ['asisten-01', 'praktikan'],
    ['praktikan-01', 'admin' as Role],
    ['praktikan-01', null as unknown as Role],
  ] as const) {
    assert.equal(store.actions.selectUser(id, role), false);
    assert.equal(store.getSnapshot(), before);
  }
  assert.equal(store.actions.selectUser('praktikan-01'), true);
  assert.equal(store.getSnapshot(), before);
  assert.equal(notifications, 0);
  store.actions.selectUser('asisten-01');
  assert.equal(notifications, 1);
  stop();
  store.actions.selectUser('praktikan-02');
  assert.equal(notifications, 1);
});

test('reset and independent provider stores start from fresh fixture snapshots', () => {
  const first = createDemoStore();
  const second = createDemoStore();
  first.actions.selectUser('asisten-01');
  assert.equal(second.getSnapshot().currentUserId, null);
  const beforeReset = first.getSnapshot();
  assert.equal(first.actions.resetDemo().ok, true);
  assert.deepEqual(first.getSnapshot(), createInitialDemoState());
  assert.notEqual(first.getSnapshot().sessions, beforeReset.sessions);
  assert.notEqual(first.getSnapshot().attendanceRecords, beforeReset.attendanceRecords);
  assert.equal(beforeReset.currentUserId, 'asisten-01');
});

test('selectors keep schedules, personal attendance, and assistant rosters scoped to the active user', () => {
  const store = createDemoStore();
  assert.deepEqual(selectMySessions(store.getSnapshot()), []);
  store.actions.selectUser('praktikan-01');
  const history = selectMyAttendance(store.getSnapshot());
  assert.ok(history.every((entry) => entry.student.id === 'praktikan-01'));
  assert.equal(selectMySession(store.getSnapshot(), 'sesi-04'), null);
  assert.deepEqual(selectSessionParticipants(store.getSnapshot(), 'sesi-02'), []);
  assert.equal(selectAttendanceSummary(store.getSnapshot(), 'sesi-02'), null);
  store.actions.selectUser('asisten-01');
  assert.deepEqual(selectMyAttendance(store.getSnapshot()), []);
  assert.deepEqual(selectAttendanceSummary(store.getSnapshot(), 'sesi-02'), {
    total: 2,
    present: 1,
    notPresent: 1,
  });
  store.actions.selectUser('asisten-02');
  assert.deepEqual(selectSessionParticipants(store.getSnapshot(), 'sesi-01'), []);
  assert.deepEqual(selectAttendanceSummary(store.getSnapshot(), 'sesi-05'), {
    total: 0,
    present: 0,
    notPresent: 0,
  });
  store.actions.selectUser('praktikan-04');
  assert.deepEqual(selectMySessions(store.getSnapshot()), []);
  assert.deepEqual(selectMyAttendance(store.getSnapshot()), []);
  store.actions.selectUser('asisten-03');
  assert.deepEqual(selectMySessions(store.getSnapshot()), []);
});
