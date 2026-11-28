export type SessionStatus = 'belum-dibuka' | 'dibuka' | 'ditutup';

export type AttendanceStatus =
  | 'belum-presensi'
  | 'hadir'
  | 'tidak-hadir'
  | 'izin'
  | 'izin-menunggu';

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/**
 * View model untuk kartu jadwal (SRS-05).
 * Semua label sudah diformat agar layar tidak bergantung pada util tanggal global.
 */
export type SessionListItem = {
  id: string;
  practicalName: string;
  meetingLabel: string;
  className: string;
  lab: string;
  labId?: string;
  dateLabel: string;
  timeRangeLabel: string;
  startsAt?: string;
  endsAt?: string;
  status: SessionStatus;
};

export type AttendanceInfo = {
  status: AttendanceStatus;
  attendedAtLabel: string | null;
  attendedAtDateLabel: string | null;
};

/** View model untuk detail sesi praktikan (SRS-07). */
export type SessionDetail = SessionListItem & {
  myAttendance: AttendanceInfo;
};

export type PraktikanIdentity = {
  id: string;
  name: string;
  nim: string;
};

/** View model untuk riwayat kehadiran pribadi (SRS-20). */
export type RiwayatItem = {
  id: string;
  sessionId: string;
  practicalName: string;
  meetingLabel: string;
  dateLabel: string;
  startsAt: string;
  status: AttendanceStatus;
  attendedAtLabel: string | null;
  attendedAtDateLabel: string | null;
};

/**
 * Hasil aksi presensi dari sumber state bersama; layar hanya menampilkan hasilnya.
 * Waktu hadir dibaca dari record tersimpan agar sama dengan rekap asisten.
 */
export type AttendanceActionResult = { ok: true } | { ok: false; reason: string };
export type AttendanceLocationInput = Readonly<{
  latitude: number;
  longitude: number;
  accuracy: number | null;
}>;
