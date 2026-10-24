import {
  attendanceStatusLabels,
  sessionStatusLabels,
} from '../../../core/selectors';
import type { AttendanceEntry, Session } from '../../../core/types';
import type {
  AssistantBadgeTone,
  AssistantSessionItem,
  AttendanceFilter,
  ParticipantItem,
} from '../types';

/** Format ISO 8601 jadi label tanggal tampilan (contoh: 26 Okt 2026). */
export function formatDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Format ISO 8601 jadi label waktu tampilan (contoh: 08.00). */
export function formatTimeLabel(iso: string): string {
  return new Date(iso)
    .toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    .replace(':', '.');
}

/** Map status sesi ke badge tone semantik. */
export function getSessionStatusTone(status: Session['status']): AssistantBadgeTone {
  switch (status) {
    case 'open':
      return 'success';
    case 'upcoming':
      return 'info';
    case 'closed':
      return 'neutral';
    default:
      return 'neutral';
  }
}

/** Map status kehadiran peserta ke badge tone semantik. */
export function getAttendanceStatusTone(
  status: AttendanceEntry['status'],
): AssistantBadgeTone {
  switch (status) {
    case 'present':
      return 'success';
    case 'pending':
      return 'neutral';
    case 'absent':
      return 'danger';
    default:
      return 'neutral';
  }
}

/** Ubah data Session Core jadi AssistantSessionItem untuk Jadwal & Rekap. */
export function toAssistantSessionItem(session: Session): AssistantSessionItem {
  return {
    id: session.id,
    practicalName: session.practicumName,
    meetingLabel: `Pertemuan ${session.meeting}`,
    className: session.className,
    lab: session.lab,
    dateLabel: formatDateLabel(session.startsAt),
    timeRangeLabel: `${formatTimeLabel(session.startsAt)} - ${formatTimeLabel(session.endsAt)}`,
    status: session.status,
    statusLabel: sessionStatusLabels[session.status],
    studentCount: session.studentIds.length,
  };
}

/** Ubah data AttendanceEntry Core jadi ParticipantItem untuk daftar peserta. */
export function toParticipantItem(entry: AttendanceEntry): ParticipantItem {
  return {
    id: entry.student.id,
    name: entry.student.name,
    nim: entry.student.number,
    group: entry.student.group,
    status: entry.status,
    statusLabel: attendanceStatusLabels[entry.status],
    attendedAtLabel: entry.record ? formatTimeLabel(entry.record.recordedAt) : null,
  };
}

/** Filter daftar peserta berdasarkan filter pilihan (SRS-19). */
export function filterParticipants(
  participants: readonly ParticipantItem[],
  filter: AttendanceFilter,
): ParticipantItem[] {
  if (filter === 'hadir') {
    return participants.filter((item) => item.status === 'present');
  }
  if (filter === 'belum-hadir') {
    return participants.filter(
      (item) => item.status === 'pending' || item.status === 'absent',
    );
  }
  return [...participants];
}
