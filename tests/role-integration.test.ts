import assert from 'node:assert/strict';
import test from 'node:test';

import { createDemoStore } from '../src/core/demo-store';
import { selectAttendanceRecord, selectMyAttendance, selectMySession } from '../src/core/selectors';
import {
  formatAttendanceTime,
  selectAssistantSession,
  selectAssistantSessions,
} from '../src/features/assistant/session-view';
import { getAttendanceAction } from '../src/features/practitioner/lib/attendance-action';
import { formatTimeLabel, toSessionListItem } from '../src/features/practitioner/lib/argamapping';

test('assistant and practitioner screen views complete the same session through role switches', () => {
  const store = createDemoStore({ now: () => '2026-10-26T01:04:05.000Z' });
  const { actions } = store;
  actions.selectUser('asisten-01');
  const scheduled = selectAssistantSessions(store.getSnapshot()).find(
    ({ session }) => session.id === 'sesi-01',
  );
  assert.ok(scheduled);
  assert.equal(scheduled.session.status, 'upcoming');
  const initial = selectAssistantSession(store.getSnapshot(), scheduled.session.id);
  assert.ok(initial?.canOpen);
  assert.equal(initial.canClose, false);

  assert.equal(actions.openSession(initial.session.id).ok, true);
  actions.selectUser('praktikan-01');
  const session = selectMySession(store.getSnapshot(), initial.session.id);
  assert.ok(session);
  const practitionerView = toSessionListItem(session);
  assert.equal(practitionerView.status, 'dibuka');
  assert.equal(practitionerView.practicalName, initial.session.practicumName);
  assert.equal(getAttendanceAction(practitionerView.status, 'belum-presensi').disabled, false);
  assert.equal(actions.recordAttendance(session.id, 'praktikan-01').ok, true);
  assert.equal(actions.recordAttendance(session.id, 'praktikan-01').ok, false);
  const record = selectAttendanceRecord(store.getSnapshot(), session.id, 'praktikan-01');
  assert.ok(record);

  actions.selectUser('asisten-01');
  const recap = selectAssistantSession(store.getSnapshot(), session.id, 'present');
  assert.ok(recap);
  assert.deepEqual(recap.summary, { total: 2, present: 1, notPresent: 1 });
  assert.equal(recap.canOpen, false);
  assert.equal(recap.canClose, true);
  assert.equal(recap.filteredParticipants.length, 1);
  assert.equal(recap.filteredParticipants[0].record, record);
  assert.equal(
    formatAttendanceTime(record.recordedAt),
    formatTimeLabel(record.recordedAt),
  );
  const pending = selectAssistantSession(store.getSnapshot(), session.id, 'not-present');
  assert.deepEqual(
    pending?.filteredParticipants.map((entry) => entry.student.id),
    ['praktikan-02'],
  );
  assert.equal(pending?.filteredParticipants[0].status, 'pending');
  assert.equal(actions.closeSession(session.id).ok, true);
  const closed = selectAssistantSession(store.getSnapshot(), session.id, 'not-present');
  assert.equal(closed?.notPresentLabel, 'Tidak Hadir');
  assert.equal(closed?.filteredParticipants[0].status, 'absent');
  assert.equal(closed?.canOpen, false);
  assert.equal(closed?.canClose, false);

  actions.selectUser('praktikan-01');
  const closedSession = selectMySession(store.getSnapshot(), session.id);
  assert.ok(closedSession);
  assert.equal(toSessionListItem(closedSession).status, 'ditutup');
  assert.equal(getAttendanceAction('ditutup', 'hadir').disabled, true);
  assert.equal(actions.recordAttendance(session.id, 'praktikan-01').ok, false);
  assert.equal(
    selectMyAttendance(store.getSnapshot()).find((entry) => entry.session.id === session.id)
      ?.record,
    record,
  );
  actions.selectUser('praktikan-02');
  assert.equal(actions.recordAttendance(session.id, 'praktikan-02').ok, false);
  assert.equal(getAttendanceAction('ditutup', 'tidak-hadir').disabled, true);
  actions.selectUser('asisten-01');
  assert.equal(
    selectAssistantSessions(store.getSnapshot()).find((item) => item.session.id === session.id)
      ?.summary.present,
    1,
  );
  assert.equal(actions.openSession(session.id).ok, false);
});

test('assistant views use assignment and explicit session enrolment, including empty fixtures', () => {
  const store = createDemoStore();
  assert.deepEqual(selectAssistantSessions(store.getSnapshot()), []);
  store.actions.selectUser('praktikan-01');
  assert.equal(selectAssistantSession(store.getSnapshot(), 'sesi-01'), null);
  assert.deepEqual(selectAssistantSessions(store.getSnapshot()), []);
  store.actions.selectUser('asisten-01');
  assert.equal(selectAssistantSession(store.getSnapshot(), 'sesi-04'), null);
  assert.equal(selectAssistantSession(store.getSnapshot(), 'session-01'), null);
  store.actions.selectUser('asisten-02');
  const roster = selectAssistantSession(store.getSnapshot(), 'sesi-04');
  assert.deepEqual(
    roster?.participants.map((entry) => entry.student.id),
    ['praktikan-03'],
  );
  const empty = selectAssistantSession(store.getSnapshot(), 'sesi-05');
  assert.deepEqual(empty?.summary, { total: 0, present: 0, notPresent: 0 });
  assert.deepEqual(empty?.participants, []);
  store.actions.selectUser('asisten-03');
  assert.deepEqual(selectAssistantSessions(store.getSnapshot()), []);
});

test('changing assistant view filters does not mutate or replace the shared snapshot', () => {
  const store = createDemoStore();
  store.actions.selectUser('asisten-01');
  const snapshot = store.getSnapshot();
  const originalOrder = snapshot.sessions.map((session) => session.id);
  selectAssistantSessions(snapshot);
  for (const filter of ['all', 'present', 'not-present'] as const) {
    const view = selectAssistantSession(snapshot, 'sesi-02', filter);
    assert.ok(view);
    assert.equal(
      view.session,
      snapshot.sessions.find((session) => session.id === 'sesi-02'),
    );
    assert.deepEqual(view.summary, { total: 2, present: 1, notPresent: 1 });
  }
  assert.equal(store.getSnapshot(), snapshot);
  assert.deepEqual(
    snapshot.sessions.map((session) => session.id),
    originalOrder,
  );
});

test('old assistant callbacks reject another active identity and preserve the latest snapshot', () => {
  const store = createDemoStore();
  store.actions.selectUser('asisten-01');
  const openFromOldScreen = () => store.actions.openSession('sesi-01');
  store.actions.selectUser('asisten-02');
  const snapshot = store.getSnapshot();
  assert.equal(openFromOldScreen().ok, false);
  assert.equal(store.getSnapshot(), snapshot);
  assert.equal(selectAssistantSession(snapshot, 'sesi-01'), null);
  store.actions.selectUser('asisten-01');
  assert.equal(selectAssistantSession(store.getSnapshot(), 'sesi-01')?.session.status, 'upcoming');
});
