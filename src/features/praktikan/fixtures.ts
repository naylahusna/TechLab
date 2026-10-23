import type {
  PraktikanIdentity,
  RiwayatItem,
  SessionDetail,
  SessionListItem,
} from './types';

/**
 * Data contoh sementara untuk pengembangan UI (SRS-21 milik Arga).
 * Jangan diimpor dari route produksi. Ganti dengan selector store setelah
 * fondasi bersama tersedia.
 */

export const praktikanFixture: PraktikanIdentity = {
  id: 'praktikan-demo-1',
  name: 'Aulia Rahma',
  nim: '2211102045',
};

export const sessionDetailsFixture: SessionDetail[] = [
  {
    id: 'sesi-web-5',
    practicalName: 'Praktikum Pemrograman Web',
    className: 'IF-3A',
    lab: 'Lab Komputer 2',
    dateLabel: 'Senin, 26 Oktober 2026',
    timeLabel: '08.00-10.00',
    status: 'dibuka',
    meetingLabel: 'Pertemuan 5',
    myAttendance: { status: 'belum-presensi', attendedAtLabel: null },
  },
  {
    id: 'sesi-basdat-4',
    practicalName: 'Praktikum Basis Data',
    className: 'IF-3B',
    lab: 'Lab Basis Data',
    dateLabel: 'Selasa, 27 Oktober 2026',
    timeLabel: '10.00-12.00',
    status: 'belum-dibuka',
    meetingLabel: 'Pertemuan 4',
    myAttendance: { status: 'belum-presensi', attendedAtLabel: null },
  },
  {
    id: 'sesi-jarkom-3',
    practicalName: 'Praktikum Jaringan Komputer',
    className: 'IF-3A',
    lab: 'Lab Jaringan',
    dateLabel: 'Rabu, 21 Oktober 2026',
    timeLabel: '13.00-15.00',
    status: 'ditutup',
    meetingLabel: 'Pertemuan 3',
    myAttendance: { status: 'hadir', attendedAtLabel: '13.04' },
  },
  {
    id: 'sesi-sisop-2',
    practicalName: 'Praktikum Sistem Operasi',
    className: 'IF-3A',
    lab: 'Lab Sistem Operasi',
    dateLabel: 'Rabu, 14 Oktober 2026',
    timeLabel: '13.00-15.00',
    status: 'ditutup',
    meetingLabel: 'Pertemuan 2',
    myAttendance: { status: 'tidak-hadir', attendedAtLabel: null },
  },
];

function toListItem(detail: SessionDetail): SessionListItem {
  return {
    id: detail.id,
    practicalName: detail.practicalName,
    className: detail.className,
    lab: detail.lab,
    dateLabel: detail.dateLabel,
    timeLabel: detail.timeLabel,
    status: detail.status,
  };
}

export const jadwalFixtures: SessionListItem[] = sessionDetailsFixture.map(toListItem);

export const detailFixture: SessionDetail = sessionDetailsFixture[0];

export const riwayatFixtures: RiwayatItem[] = [
  {
    id: 'riwayat-jarkom-3',
    sessionId: 'sesi-jarkom-3',
    practicalName: 'Praktikum Jaringan Komputer',
    meetingLabel: 'Pertemuan 3',
    dateLabel: 'Rabu, 21 Oktober 2026',
    status: 'hadir',
    attendedAtLabel: '13.04',
  },
  {
    id: 'riwayat-sisop-2',
    sessionId: 'sesi-sisop-2',
    practicalName: 'Praktikum Sistem Operasi',
    meetingLabel: 'Pertemuan 2',
    dateLabel: 'Rabu, 14 Oktober 2026',
    status: 'tidak-hadir',
    attendedAtLabel: null,
  },
  {
    id: 'riwayat-web-4',
    sessionId: 'sesi-web-4',
    practicalName: 'Praktikum Pemrograman Web',
    meetingLabel: 'Pertemuan 4',
    dateLabel: 'Senin, 12 Oktober 2026',
    status: 'hadir',
    attendedAtLabel: '08.07',
  },
];

export const emptyJadwalFixture: SessionListItem[] = [];
export const emptyRiwayatFixture: RiwayatItem[] = [];
