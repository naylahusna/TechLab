import { initialIdentity } from './identity-state';
import type { AttendanceRecord, DemoState, Session } from './types';
import { users } from './users';

/** Fixed dates are demo information; sessions change status only through an action. */
const sessionSeeds: readonly Session[] = [
  {
    id: 'sesi-01',
    practicumName: 'Pemrograman Perangkat Bergerak',
    meeting: 5,
    className: 'Informatika A',
    lab: 'Lab Komputasi 1',
    startsAt: '2026-10-26T08:00:00+07:00',
    endsAt: '2026-10-26T10:00:00+07:00',
    status: 'upcoming',
    assistantId: 'asisten-01',
    studentIds: ['praktikan-01', 'praktikan-02'],
  },
  {
    id: 'sesi-02',
    practicumName: 'Basis Data',
    meeting: 4,
    className: 'Informatika A',
    lab: 'Lab Komputasi 2',
    startsAt: '2026-10-24T10:00:00+07:00',
    endsAt: '2026-10-24T12:00:00+07:00',
    status: 'open',
    assistantId: 'asisten-01',
    studentIds: ['praktikan-01', 'praktikan-02'],
  },
  {
    id: 'sesi-03',
    practicumName: 'Pemrograman Perangkat Bergerak',
    meeting: 4,
    className: 'Informatika A',
    lab: 'Lab Komputasi 1',
    startsAt: '2026-10-19T08:00:00+07:00',
    endsAt: '2026-10-19T10:00:00+07:00',
    status: 'closed',
    assistantId: 'asisten-01',
    studentIds: ['praktikan-01', 'praktikan-02'],
  },
  {
    id: 'sesi-04',
    practicumName: 'Algoritma dan Struktur Data',
    meeting: 5,
    className: 'Informatika B',
    lab: 'Lab Komputasi 2',
    startsAt: '2026-10-27T13:00:00+07:00',
    endsAt: '2026-10-27T15:00:00+07:00',
    status: 'upcoming',
    assistantId: 'asisten-02',
    studentIds: ['praktikan-03'],
  },
  {
    id: 'sesi-05',
    practicumName: 'Jaringan Komputer',
    meeting: 3,
    className: 'Informatika B',
    lab: 'Lab Jaringan',
    startsAt: '2026-10-24T13:00:00+07:00',
    endsAt: '2026-10-24T15:00:00+07:00',
    status: 'open',
    assistantId: 'asisten-02',
    studentIds: [],
  },
];

const attendanceSeeds: readonly AttendanceRecord[] = [
  {
    id: 'sesi-02:praktikan-02',
    sessionId: 'sesi-02',
    studentId: 'praktikan-02',
    recordedAt: '2026-10-24T10:03:00+07:00',
  },
  {
    id: 'sesi-03:praktikan-01',
    sessionId: 'sesi-03',
    studentId: 'praktikan-01',
    recordedAt: '2026-10-19T08:02:00+07:00',
  },
];

/** Fresh, deeply frozen data for every app instance and demo reset. */
export function createInitialDemoState(): DemoState {
  return Object.freeze({
    ...initialIdentity,
    users,
    sessions: Object.freeze(
      sessionSeeds.map((session) =>
        Object.freeze({
          ...session,
          studentIds: Object.freeze([...session.studentIds]),
        }),
      ),
    ),
    attendanceRecords: Object.freeze(attendanceSeeds.map((record) => Object.freeze({ ...record }))),
  });
}
