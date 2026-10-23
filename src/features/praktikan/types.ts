export type SessionStatus = 'belum-dibuka' | 'dibuka' | 'ditutup';

export type AttendanceStatus = 'belum-presensi' | 'hadir' | 'tidak-hadir';

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/**
 * View model untuk kartu jadwal (SRS-05).
 * Semua label sudah diformat agar layar tidak bergantung pada util tanggal global.
 */
export type SessionListItem = {
  id: string;
  practicalName: string;
  className: string;
  lab: string;
  dateLabel: string;
  timeLabel: string;
  status: SessionStatus;
};

export type AttendanceInfo = {
  status: AttendanceStatus;
  attendedAtLabel: string | null;
};

/** View model untuk detail sesi praktikan (SRS-07). */
export type SessionDetail = SessionListItem & {
  meetingLabel: string;
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
  status: AttendanceStatus;
  attendedAtLabel: string | null;
};

/**
 * Hasil aksi presensi. Implementasi store milik Arga yang menjadi sumber
 * kebenaran; layar hanya menampilkan hasilnya (SRS-14, SRS-25).
 */
export type AttendanceActionResult =
  | { ok: true; attendedAtLabel: string }
  | { ok: false; reason: string };
