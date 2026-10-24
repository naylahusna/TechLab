import assert from 'node:assert/strict';
import test from 'node:test';
import { createDemoStore, type DemoStore } from '../src/core/demo-store';
import { transitionDemo, type DemoAction } from '../src/core/demo-state';
import { validateAttendance, validateSessionAction } from '../src/core/rules';
import { selectMySession } from '../src/core/selectors';
import type { ActionResult, ActionErrorCode } from '../src/core/types';

function rejects(store: DemoStore, action: () => ActionResult, code: ActionErrorCode) {
  const before = store.getSnapshot();
  const result = action();
  assert.equal(result.ok, false);
  if (result.ok) assert.fail('Expected rejection');
  assert.equal(result.code, code);
  assert.ok(result.message);
  assert.equal(store.getSnapshot(), before);
}

test('session changes require an active assigned assistant and an existing session', () => {
  const store = createDemoStore();
  rejects(store, () => store.actions.openSession('sesi-01'), 'USER_REQUIRED');
  rejects(store, () => store.actions.closeSession('sesi-02'), 'USER_REQUIRED');
  store.actions.selectUser('praktikan-01');
  rejects(store, () => store.actions.openSession('sesi-01'), 'ASSISTANT_REQUIRED');
  rejects(store, () => store.actions.closeSession('sesi-02'), 'ASSISTANT_REQUIRED');
  store.actions.selectUser('asisten-02');
  rejects(store, () => store.actions.openSession('sesi-01'), 'NOT_ASSIGNED');
  rejects(store, () => store.actions.closeSession('sesi-02'), 'NOT_ASSIGNED');
  store.actions.selectUser('asisten-01');
  rejects(store, () => store.actions.openSession('missing'), 'SESSION_NOT_FOUND');
  rejects(store, () => store.actions.closeSession('missing'), 'SESSION_NOT_FOUND');
});

test('only upcoming to open to closed transitions are accepted', () => {
  const store = createDemoStore();
  store.actions.selectUser('asisten-01');
  rejects(store, () => store.actions.closeSession('sesi-01'), 'INVALID_SESSION_TRANSITION');
  rejects(store, () => store.actions.openSession('sesi-02'), 'INVALID_SESSION_TRANSITION');
  rejects(store, () => store.actions.openSession('sesi-03'), 'INVALID_SESSION_TRANSITION');
  rejects(store, () => store.actions.closeSession('sesi-03'), 'INVALID_SESSION_TRANSITION');
  const oldSnapshot = store.getSnapshot();
  assert.equal(store.actions.openSession('sesi-01').ok, true);
  assert.equal(
    oldSnapshot.sessions.find((session) => session.id === 'sesi-01')?.status,
    'upcoming',
  );
  assert.equal(selectMySession(store.getSnapshot(), 'sesi-01')?.status, 'open');
  rejects(store, () => store.actions.openSession('sesi-01'), 'INVALID_SESSION_TRANSITION');
  assert.equal(store.actions.closeSession('sesi-01').ok, true);
  rejects(store, () => store.actions.openSession('sesi-01'), 'INVALID_SESSION_TRANSITION');
  assert.equal(store.getSnapshot().attendanceRecords, oldSnapshot.attendanceRecords);
});

test('session status survives role changes and captured actions validate the latest identity', () => {
  const store = createDemoStore();
  store.actions.selectUser('asisten-01');
  const { openSession, closeSession } = store.actions;
  assert.equal(openSession('sesi-01').ok, true);
  store.actions.selectUser('praktikan-01');
  assert.equal(selectMySession(store.getSnapshot(), 'sesi-01')?.status, 'open');
  rejects(store, () => closeSession('sesi-01'), 'ASSISTANT_REQUIRED');
  store.actions.selectUser('asisten-02');
  rejects(store, () => closeSession('sesi-01'), 'NOT_ASSIGNED');
  store.actions.selectUser('asisten-01');
  assert.equal(closeSession('sesi-01').ok, true);
  store.actions.selectUser('praktikan-01');
  assert.equal(selectMySession(store.getSnapshot(), 'sesi-01')?.status, 'closed');
});

test('attendance availability explains invalid roles, identities, enrolment, duplicates and statuses', () => {
  const store = createDemoStore();
  rejects(
    store,
    () => validateAttendance(store.getSnapshot(), 'sesi-02', 'praktikan-01'),
    'USER_REQUIRED',
  );
  store.actions.selectUser('asisten-01');
  rejects(
    store,
    () => validateAttendance(store.getSnapshot(), 'sesi-02', 'praktikan-01'),
    'STUDENT_REQUIRED',
  );
  store.actions.selectUser('praktikan-01');
  rejects(
    store,
    () => validateAttendance(store.getSnapshot(), 'missing', 'praktikan-01'),
    'SESSION_NOT_FOUND',
  );
  rejects(
    store,
    () => validateAttendance(store.getSnapshot(), 'sesi-02', 'praktikan-02'),
    'IDENTITY_MISMATCH',
  );
  rejects(
    store,
    () => validateAttendance(store.getSnapshot(), 'sesi-01', 'praktikan-01'),
    'SESSION_NOT_OPEN',
  );
  assert.equal(validateAttendance(store.getSnapshot(), 'sesi-02', 'praktikan-01').ok, true);
  store.actions.selectUser('praktikan-02');
  rejects(
    store,
    () => validateAttendance(store.getSnapshot(), 'sesi-02', 'praktikan-02'),
    'ALREADY_PRESENT',
  );
  rejects(
    store,
    () => validateAttendance(store.getSnapshot(), 'sesi-03', 'praktikan-02'),
    'SESSION_NOT_OPEN',
  );
  store.actions.selectUser('praktikan-03');
  rejects(
    store,
    () => validateAttendance(store.getSnapshot(), 'sesi-02', 'praktikan-03'),
    'NOT_ENROLLED',
  );
});

test('unknown commands and inconsistent actor state are rejected without changing data', () => {
  const store = createDemoStore();
  store.actions.selectUser('praktikan-01');
  const state = store.getSnapshot();
  const invalid = { ...state, currentRole: 'asisten' as const };
  assert.equal(validateAttendance(invalid, 'sesi-02', 'praktikan-01').ok, false);
  assert.equal(validateSessionAction(invalid, 'sesi-01', 'open').ok, false);
  rejects(
    store,
    () => validateSessionAction(state, 'sesi-02', 'delete' as 'close'),
    'INVALID_ACTION',
  );
  const unknown = transitionDemo(state, { type: 'unknown' } as unknown as DemoAction);
  assert.equal(unknown.state, state);
  assert.equal(unknown.result.ok, false);
});

test('successful mutations notify once, rejected actions do not, and reset restores statuses', () => {
  const store = createDemoStore();
  store.actions.selectUser('asisten-01');
  let count = 0;
  const stop = store.subscribe(() => {
    count++;
  });
  store.actions.openSession('sesi-01');
  store.actions.openSession('sesi-01');
  assert.equal(count, 1);
  store.actions.closeSession('sesi-01');
  assert.equal(count, 2);
  stop();
  store.actions.resetDemo();
  assert.equal(count, 2);
  assert.equal(
    store.getSnapshot().sessions.find((session) => session.id === 'sesi-01')?.status,
    'upcoming',
  );
});
