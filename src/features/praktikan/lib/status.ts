import type { AttendanceStatus, BadgeTone, SessionStatus } from '../types';

type StatusMeta = {
  label: string;
  tone: BadgeTone;
};

export const SESSION_STATUS_META: Record<SessionStatus, StatusMeta> = {
  'belum-dibuka': { label: 'Belum Dibuka', tone: 'neutral' },
  dibuka: { label: 'Dibuka', tone: 'success' },
  ditutup: { label: 'Ditutup', tone: 'danger' },
};

export const ATTENDANCE_STATUS_META: Record<AttendanceStatus, StatusMeta> = {
  'belum-presensi': { label: 'Belum Presensi', tone: 'warning' },
  hadir: { label: 'Sudah Presensi', tone: 'success' },
  'tidak-hadir': { label: 'Tidak Hadir', tone: 'danger' },
};
