import assert from 'node:assert/strict';
import test from 'node:test';

import { createInitialDemoState } from '../src/core/demo-data';

test('dummy data has valid identities, rosters, dates, and unique attendance across all statuses', () => {
  const state = createInitialDemoState();
  const byId = new Map(state.users.map((user) => [user.id, user]));
  assert.equal(byId.size, state.users.length);
  assert.equal(new Set(state.sessions.map((session) => session.id)).size, state.sessions.length);
  assert.deepEqual(
    new Set(state.sessions.map((session) => session.status)),
    new Set(['upcoming', 'open', 'closed']),
  );
  for (const session of state.sessions) {
    assert.equal(byId.get(session.assistantId)?.role, 'asisten');
    assert.ok(session.practicumName && session.className && session.lab);
    assert.ok(Date.parse(session.startsAt) < Date.parse(session.endsAt));
    assert.equal(new Set(session.studentIds).size, session.studentIds.length);
    for (const id of session.studentIds) assert.equal(byId.get(id)?.role, 'praktikan');
  }
  const attendanceKeys = state.attendanceRecords.map(
    (record) => `${record.sessionId}:${record.studentId}`,
  );
  assert.equal(new Set(attendanceKeys).size, attendanceKeys.length);
  for (const record of state.attendanceRecords) {
    const session = state.sessions.find((item) => item.id === record.sessionId);
    assert.ok(session);
    assert.ok(session.studentIds.includes(record.studentId));
    assert.notEqual(session.status, 'upcoming');
    assert.ok(Number.isFinite(Date.parse(record.recordedAt)));
  }
});

test('dummy fixtures offer empty student schedules, empty assistant schedules, and an empty roster', () => {
  const state = createInitialDemoState();
  assert.equal(state.users.find((user) => user.id === 'praktikan-04')?.role, 'praktikan');
  assert.equal(state.users.find((user) => user.id === 'asisten-03')?.role, 'asisten');
  assert.ok(state.sessions.every((session) => !session.studentIds.includes('praktikan-04')));
  assert.ok(state.sessions.every((session) => session.assistantId !== 'asisten-03'));
  assert.deepEqual(state.sessions.find((session) => session.id === 'sesi-05')?.studentIds, []);
});

test('initial snapshots are independent and all shared data is frozen against direct mutation', () => {
  const first = createInitialDemoState();
  const second = createInitialDemoState();
  assert.deepEqual(first, second);
  assert.notEqual(first, second);
  assert.notEqual(first.sessions, second.sessions);
  assert.notEqual(first.sessions[0].studentIds, second.sessions[0].studentIds);
  assert.ok(Object.isFrozen(first));
  assert.ok(Object.isFrozen(first.users));
  assert.ok(Object.isFrozen(first.users[0]));
  assert.ok(Object.isFrozen(first.sessions));
  assert.ok(Object.isFrozen(first.sessions[0]));
  assert.ok(Object.isFrozen(first.sessions[0].studentIds));
  assert.ok(Object.isFrozen(first.attendanceRecords));
  assert.ok(Object.isFrozen(first.attendanceRecords[0]));
  assert.throws(() => (first.sessions[0].studentIds as string[]).push('praktikan-04'), TypeError);
});
