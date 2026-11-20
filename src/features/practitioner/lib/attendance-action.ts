import type { AttendanceStatus, SessionStatus } from '../types';

export type AttendanceActionKind =
  | 'available'
  | 'already-attended'
  | 'not-open'
  | 'outside-time'
  | 'closed'
  | 'unavailable';

export type AttendanceAction = {
  kind: AttendanceActionKind;
  label: string;
  disabled: boolean;
  reason: string | null;
};

/**
 * Aturan tampilan tombol presensi (SRS-16).
 *
 * Ini hanya keputusan UI. Validasi akhir tetap dilakukan store (SRS-15/25)
 * karena status bisa berubah setelah layar dirender.
 */
export function getAttendanceAction(
  sessionStatus: SessionStatus,
  attendanceStatus: AttendanceStatus,
  startsAt?: string,
  endsAt?: string,
  now = Date.now(),
): AttendanceAction {
  if (attendanceStatus === 'izin' || attendanceStatus === 'izin-menunggu')
    return {
      kind: 'unavailable',
      label: attendanceStatus === 'izin' ? 'Izin Disetujui' : 'Izin Sedang Ditinjau',
      disabled: true,
      reason:
        'Pantau pengajuanmu di tab Izin. Presensi tidak dapat dicatat selama pengajuan menunggu atau disetujui.',
    };
  if (attendanceStatus === 'hadir') {
    return {
      kind: 'already-attended',
      label: 'Sudah Presensi',
      disabled: true,
      reason: 'Kamu sudah tercatat hadir pada sesi ini.',
    };
  }

  if (sessionStatus === 'belum-dibuka') {
    return {
      kind: 'not-open',
      label: 'Sesi Belum Dibuka',
      disabled: true,
      reason: 'Presensi dapat dilakukan setelah asisten membuka sesi.',
    };
  }

  if (sessionStatus === 'ditutup') {
    return {
      kind: 'closed',
      label: 'Sesi Telah Ditutup',
      disabled: true,
      reason: 'Sesi sudah ditutup sehingga presensi baru tidak dapat dicatat.',
    };
  }

  if (startsAt && endsAt && (now < Date.parse(startsAt) || now > Date.parse(endsAt))) {
    return {
      kind: 'outside-time',
      label: 'Di luar waktu presensi',
      disabled: true,
      reason: `Presensi hanya tersedia pada rentang waktu kelas (${new Date(startsAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}–${new Date(endsAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}).`,
    };
  }

  if (attendanceStatus === 'tidak-hadir') {
    return {
      kind: 'unavailable',
      label: 'Tidak Dapat Presensi',
      disabled: true,
      reason: 'Status kehadiranmu tidak memungkinkan presensi pada sesi ini.',
    };
  }

  return {
    kind: 'available',
    label: 'Presensi Sekarang',
    disabled: false,
    reason: null,
  };
}
