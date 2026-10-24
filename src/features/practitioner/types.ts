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
  meetingLabel: string;
  className: string;
  lab: string;
  dateLabel: string;
  timeRangeLabel: string;
  status: SessionStatus;
};

export type AttendanceInfo = {
  status: AttendanceStatus;
  attendedAtLabel: string | null;
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
};

/**
 * Hasil aksi presensi. Implementasi store milik Arga yang menjadi sumber
 * kebenaran; layar hanya menampilkan hasilnya (SRS-14, SRS-25).
 * Waktu hadir dibaca dari record tersimpan agar sama dengan rekap asisten.
 */
export type AttendanceActionResult = { ok: true } | { ok: false; reason: string };
