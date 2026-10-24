import type {
  Session as ArgaSession,
  SessionStatus as ArgaSessionStatus,
  AttendanceStatus as ArgaAttendanceStatus,
} from '../../../core/types';
import type { AttendanceStatus, SessionListItem, SessionStatus } from '../types';

/** Map status sesi Arga ke view model praktikan. */
export function mapSessionStatus(status: ArgaSessionStatus): SessionStatus {
  switch (status) {
    case 'upcoming':
      return 'belum-dibuka';
    case 'open':
      return 'dibuka';
    case 'closed':
      return 'ditutup';
  }
  throw new Error(`Unknown session status: ${status}`);
}

/** Map status kehadiran Arga ke view model praktikan. */
export function mapAttendanceStatus(status: ArgaAttendanceStatus): AttendanceStatus {
  switch (status) {
    case 'present':
      return 'hadir';
    case 'pending':
      return 'belum-presensi';
    case 'absent':
      return 'tidak-hadir';
  }
  throw new Error(`Unknown attendance status: ${status}`);
}

/** Format ISO 8601 jadi label tanggal tampilan (contoh: 24 Okt 2026). */
export function formatDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Format ISO 8601 jadi label waktu tampilan (contoh: 10.00). */
export function formatTimeLabel(iso: string): string {
  return new Date(iso)
    .toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    .replace(':', '.');
}

/** Ubah data Session Arga jadi SessionListItem untuk JadwalScreen. */
export function toSessionListItem(session: ArgaSession): SessionListItem {
  return {
    id: session.id,
    practicalName: session.practicumName,
    className: session.className,
    lab: session.lab,
    dateLabel: formatDateLabel(session.startsAt),
    timeLabel: formatTimeLabel(session.startsAt),
    status: mapSessionStatus(session.status),
  };
}
