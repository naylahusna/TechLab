import assert from 'node:assert/strict';
import test from 'node:test';

import { createDemoStore } from '../src/core/demo-store';
import {
  selectAttendanceSummary,
  selectMySession,
  selectMySessions,
  selectSessionParticipants,
} from '../src/core/selectors';
import {
  filterParticipants,
  formatDateLabel,
  formatTimeLabel,
  getAttendanceStatusTone,
  getSessionStatusTone,
  toAssistantSessionItem,
  toParticipantItem,
} from '../src/features/assistant/lib/assistant-mapping';
import type { AttendanceFilter } from '../src/features/assistant/types';

test('assistant maps core session to view model correctly (SRS-06)', () => {
  const store = createDemoStore();
  store.actions.selectUser('asisten-01', 'asisten');
  const session = selectMySession(store.getSnapshot(), 'sesi-01');
  assert.ok(session);

  const item = toAssistantSessionItem(session);
  assert.equal(item.id, 'sesi-01');
  assert.equal(item.practicalName, 'Pemrograman Perangkat Bergerak');
  assert.equal(item.meetingLabel, 'Pertemuan 5');
  assert.equal(item.className, 'Informatika A');
  assert.equal(item.lab, 'Lab Komputasi 1');
  assert.equal(item.status, 'upcoming');
  assert.equal(item.statusLabel, 'Belum Dibuka');
  assert.equal(item.studentCount, 2);
  assert.ok(item.dateLabel.length > 0);
  assert.match(item.timeRangeLabel, /^\d{2}\.\d{2} - \d{2}\.\d{2}$/);
});

test('assistant schedule is scoped to active assistant with empty state check (SRS-06, SRS-24)', () => {
  const store = createDemoStore();

  // Dimas handles sesi-01, sesi-02, sesi-03
  store.actions.selectUser('asisten-01', 'asisten');
  const dimasSessions = selectMySessions(store.getSnapshot());
  assert.equal(dimasSessions.length, 3);
  assert.ok(dimasSessions.every((s) => s.assistantId === 'asisten-01'));

  // Nadia handles sesi-04, sesi-05
  store.actions.selectUser('asisten-02', 'asisten');
  const nadiaSessions = selectMySessions(store.getSnapshot());
  assert.equal(nadiaSessions.length, 2);
  assert.ok(nadiaSessions.every((s) => s.assistantId === 'asisten-02'));

  // Sinta has no assigned sessions (SRS-24 empty state condition for jadwal)
  store.actions.selectUser('asisten-03', 'asisten');
  const sintaSessions = selectMySessions(store.getSnapshot());
  assert.equal(sintaSessions.length, 0);
});

test('assistant opens session and handles transitions with rejection feedback (SRS-09, SRS-11)', () => {
  const store = createDemoStore();
  store.actions.selectUser('asisten-01', 'asisten');

  // Verify initial status
  const sessionBefore = selectMySession(store.getSnapshot(), 'sesi-01');
  assert.equal(sessionBefore?.status, 'upcoming');

  // Valid opening
  const openResult = store.actions.openSession('sesi-01');
  assert.equal(openResult.ok, true);
  assert.equal(selectMySession(store.getSnapshot(), 'sesi-01')?.status, 'open');

  // Re-opening an already open session is rejected by core
  const duplicateOpen = store.actions.openSession('sesi-01');
  assert.equal(duplicateOpen.ok, false);
  assert.ok(duplicateOpen.message);

  // Assistant cannot open session of another assistant
  const foreignOpen = store.actions.openSession('sesi-04');
  assert.equal(foreignOpen.ok, false);
});

test('assistant closes session and re-opening is disabled (SRS-10, SRS-11)', () => {
  const store = createDemoStore();
  store.actions.selectUser('asisten-01', 'asisten');

  // Open then close sesi-01
  assert.equal(store.actions.openSession('sesi-01').ok, true);
  const closeResult = store.actions.closeSession('sesi-01');
  assert.equal(closeResult.ok, true);
  assert.equal(selectMySession(store.getSnapshot(), 'sesi-01')?.status, 'closed');

  // Sesi Ditutup cannot be reopened
  const reopenResult = store.actions.openSession('sesi-01');
  assert.equal(reopenResult.ok, false);
  assert.ok(reopenResult.message);
});

test('attendance summary calculates present, not present and total accurately (SRS-17)', () => {
  const store = createDemoStore();
  store.actions.selectUser('asisten-01', 'asisten');

  // sesi-02 has 2 students: Bima already attended, Alya has not
  const summary02 = selectAttendanceSummary(store.getSnapshot(), 'sesi-02');
  assert.ok(summary02);
  assert.equal(summary02.total, 2);
  assert.equal(summary02.present, 1);
  assert.equal(summary02.notPresent, 1);
  assert.equal(summary02.total, summary02.present + summary02.notPresent);

  // Nadia's sesi-05 has 0 students (SRS-24 empty participant condition)
  store.actions.selectUser('asisten-02', 'asisten');
  const summary05 = selectAttendanceSummary(store.getSnapshot(), 'sesi-05');
  assert.ok(summary05);
  assert.equal(summary05.total, 0);
  assert.equal(summary05.present, 0);
  assert.equal(summary05.notPresent, 0);
});

test('session participants lists name, identity, status and time label (SRS-18)', () => {
  const store = createDemoStore();
  store.actions.selectUser('asisten-01', 'asisten');

  const participants = selectSessionParticipants(store.getSnapshot(), 'sesi-02').map(
    toParticipantItem,
  );
  assert.equal(participants.length, 2);

  const bima = participants.find((p) => p.id === 'praktikan-02');
  assert.ok(bima);
  assert.equal(bima.name, 'Bima Pratama');
  assert.equal(bima.nim, '240101002');
  assert.equal(bima.status, 'present');
  assert.equal(bima.statusLabel, 'Hadir');
  assert.ok(bima.attendedAtLabel);
  assert.match(bima.attendedAtLabel, /^\d{2}\.\d{2}$/);

  const alya = participants.find((p) => p.id === 'praktikan-01');
  assert.ok(alya);
  assert.equal(alya.name, 'Alya Putri');
  assert.equal(alya.status, 'pending');
  assert.equal(alya.statusLabel, 'Belum Presensi');
  assert.equal(alya.attendedAtLabel, null);
});

test('filter participants filters by status without mutating original data (SRS-19, SRS-24)', () => {
  const store = createDemoStore();
  store.actions.selectUser('asisten-01', 'asisten');

  const raw = selectSessionParticipants(store.getSnapshot(), 'sesi-02').map(toParticipantItem);

  const all = filterParticipants(raw, 'semua');
  assert.equal(all.length, 2);

  const presentOnly = filterParticipants(raw, 'hadir');
  assert.equal(presentOnly.length, 1);
  assert.equal(presentOnly[0].id, 'praktikan-02');

  const notPresentOnly = filterParticipants(raw, 'belum-hadir');
  assert.equal(notPresentOnly.length, 1);
  assert.equal(notPresentOnly[0].id, 'praktikan-01');

  // Filter with no matches yields empty list (SRS-24 empty state for filter)
  const emptyFilterMatch = filterParticipants([], 'hadir');
  assert.equal(emptyFilterMatch.length, 0);

  // Original array remains untouched
  assert.equal(raw.length, 2);
});

test('tone helpers return semantic tones for session and attendance statuses', () => {
  assert.equal(getSessionStatusTone('open'), 'success');
  assert.equal(getSessionStatusTone('upcoming'), 'info');
  assert.equal(getSessionStatusTone('closed'), 'neutral');

  assert.equal(getAttendanceStatusTone('present'), 'success');
  assert.equal(getAttendanceStatusTone('pending'), 'neutral');
  assert.equal(getAttendanceStatusTone('absent'), 'danger');
});

test('end-to-end assistant workflow across roles (SRS-22)', () => {
  const recordedAt = '2026-10-26T08:15:00+07:00';
  const store = createDemoStore({ now: () => recordedAt });

  // 1. Asisten opens sesi-01
  store.actions.selectUser('asisten-01', 'asisten');
  assert.equal(store.actions.openSession('sesi-01').ok, true);

  // 2. Switch to praktikan Alya Putri
  store.actions.selectUser('praktikan-01', 'praktikan');
  const sessionForAlya = selectMySession(store.getSnapshot(), 'sesi-01');
  assert.equal(sessionForAlya?.status, 'open');

  // Alya conducts attendance
  assert.equal(store.actions.recordAttendance('sesi-01', 'praktikan-01').ok, true);

  // 3. Switch back to Asisten Dimas Aditya
  store.actions.selectUser('asisten-01', 'asisten');
  const summaryAfterAttendance = selectAttendanceSummary(store.getSnapshot(), 'sesi-01');
  assert.ok(summaryAfterAttendance);
  assert.equal(summaryAfterAttendance.present, 1);
  assert.equal(summaryAfterAttendance.notPresent, 1);

  const participants = selectSessionParticipants(store.getSnapshot(), 'sesi-01').map(
    toParticipantItem,
  );
  const alyaItem = participants.find((p) => p.id === 'praktikan-01');
  assert.equal(alyaItem?.status, 'present');
  assert.equal(alyaItem?.attendedAtLabel, formatTimeLabel(recordedAt));

  // 4. Asisten closes session
  assert.equal(store.actions.closeSession('sesi-01').ok, true);
  const closedParticipants = selectSessionParticipants(store.getSnapshot(), 'sesi-01').map(
    toParticipantItem,
  );
  const bimaItem = closedParticipants.find((p) => p.id === 'praktikan-02');
  assert.equal(bimaItem?.status, 'absent');
  assert.equal(bimaItem?.statusLabel, 'Tidak Hadir');

  // 5. Switch to Bima -> cannot attend closed session
  store.actions.selectUser('praktikan-02', 'praktikan');
  assert.equal(store.actions.recordAttendance('sesi-01', 'praktikan-02').ok, false);
});
