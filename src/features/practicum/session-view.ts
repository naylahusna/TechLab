import type { Timestamp } from 'firebase/firestore';

import { attendanceStatusLabels } from '../../core/selectors';
import type {
  AssistantSessionItem,
  AttendanceSummary,
  ParticipantItem,
  SessionWithSummary,
} from '../assistant/types';
import type {
  AttendanceStatus,
  PraktikanIdentity,
  RiwayatItem,
  SessionDetail,
  SessionListItem,
} from '../practitioner/types';
import { formatDateLabel, formatTimeLabel } from '../practitioner/lib/argamapping';
import type {
  PracticumAttendance,
  PracticumClass,
  PracticumParticipant,
  PracticumRecapEntry,
  PracticumRecapStatus,
  PracticumSchedule,
  PracticumSession,
} from './types';

export function timestampDateLabel(timestamp: Timestamp): string {
  return formatDateLabel(timestamp.toDate().toISOString());
}

export function timestampTimeLabel(timestamp: Timestamp): string {
  return formatTimeLabel(timestamp.toDate().toISOString());
}

export function sessionTimeRange(session: PracticumSession): string {
  return `${timestampTimeLabel(session.startAt)} - ${timestampTimeLabel(session.endAt)}`;
}

const assistantStatus = {
  scheduled: 'upcoming',
  open: 'open',
  closed: 'closed',
  cancelled: 'closed',
} as const;

const practitionerStatus = {
  scheduled: 'belum-dibuka',
  open: 'dibuka',
  closed: 'ditutup',
  cancelled: 'ditutup',
} as const;

const sessionStatusLabel = {
  scheduled: 'Belum Dibuka',
  open: 'Dibuka',
  closed: 'Ditutup',
  cancelled: 'Dibatalkan',
} as const;

export function toAssistantSessionItem(
  session: PracticumSession,
  classItem: PracticumClass,
  schedule: PracticumSchedule | null,
): AssistantSessionItem {
  return {
    id: session.id,
    practicalName: classItem.courseName,
    meetingLabel: schedule?.title ?? 'Sesi Praktikum',
    className: classItem.className,
    lab: schedule?.location ?? '-',
    dateLabel: timestampDateLabel(session.startAt),
    timeRangeLabel: sessionTimeRange(session),
    status: assistantStatus[session.status],
    statusLabel: sessionStatusLabel[session.status],
    studentCount: session.studentIds.length,
  };
}

export function toPractitionerSessionListItem(
  session: PracticumSession,
  classItem: PracticumClass,
  schedule: PracticumSchedule | null,
): SessionListItem {
  return {
    id: session.id,
    practicalName: classItem.courseName,
    meetingLabel: schedule?.title ?? 'Sesi Praktikum',
    className: classItem.className,
    lab: schedule?.location ?? '-',
    dateLabel: timestampDateLabel(session.startAt),
    timeRangeLabel: sessionTimeRange(session),
    status: practitionerStatus[session.status],
  };
}

export function toPractitionerSessionDetail(
  session: PracticumSession,
  classItem: PracticumClass,
  schedule: PracticumSchedule | null,
  attendance: PracticumAttendance[],
  userId: string,
): SessionDetail {
  const record = attendance.find((item) => item.userId === userId) ?? null;
  const closed = session.status === 'closed' || session.status === 'cancelled';
  const myAttendance = record
    ? {
        status: 'hadir' as const,
        attendedAtLabel: timestampTimeLabel(record.recordedAt),
        attendedAtDateLabel: timestampDateLabel(record.recordedAt),
      }
    : closed
      ? {
          status: 'tidak-hadir' as const,
          attendedAtLabel: null,
          attendedAtDateLabel: null,
        }
      : {
          status: 'belum-presensi' as const,
          attendedAtLabel: null,
          attendedAtDateLabel: null,
        };

  return {
    id: session.id,
    practicalName: classItem.courseName,
    meetingLabel: schedule?.title ?? 'Sesi Praktikum',
    className: classItem.className,
    lab: schedule?.location ?? '-',
    dateLabel: timestampDateLabel(session.startAt),
    timeRangeLabel: sessionTimeRange(session),
    status: practitionerStatus[session.status],
    myAttendance,
  };
}

export function toPractitionerHistoryItems(
  classes: readonly PracticumClass[],
  schedules: readonly PracticumSchedule[],
  sessions: readonly PracticumSession[],
  attendanceBySession: Readonly<Record<string, readonly PracticumAttendance[]>>,
  userId: string,
): RiwayatItem[] {
  const classById = new Map(classes.map((item) => [item.id, item]));
  const scheduleById = new Map(schedules.map((item) => [item.id, item]));

  return [...sessions]
    .filter((session) => {
      if (!session.studentIds.includes(userId)) return false;
      const hasRecord = (attendanceBySession[session.id] ?? []).some(
        (item) => item.userId === userId,
      );
      return hasRecord || session.status === 'closed' || session.status === 'cancelled';
    })
    .sort((left, right) => right.startAt.toMillis() - left.startAt.toMillis())
    .flatMap((session) => {
      const classItem = classById.get(session.classId);
      if (!classItem) return [];
      const record =
        (attendanceBySession[session.id] ?? []).find((item) => item.userId === userId) ??
        null;
      const closed = session.status === 'closed' || session.status === 'cancelled';
      const status: AttendanceStatus = record
        ? 'hadir'
        : closed
          ? 'tidak-hadir'
          : 'belum-presensi';
      return [
        {
          id: `${session.id}:${userId}`,
          sessionId: session.id,
          practicalName: classItem.courseName,
          meetingLabel: scheduleById.get(session.scheduleId)?.title ?? 'Sesi Praktikum',
          dateLabel: timestampDateLabel(session.startAt),
          startsAt: session.startAt.toDate().toISOString(),
          status,
          attendedAtLabel: record ? timestampTimeLabel(record.recordedAt) : null,
          attendedAtDateLabel: record ? timestampDateLabel(record.recordedAt) : null,
        },
      ];
    });
}

export function toPraktikanIdentity(profile: {
  uid: string;
  name: string;
  number: string;
}): PraktikanIdentity {
  return { id: profile.uid, name: profile.name, nim: profile.number };
}

export function toAssistantParticipants(
  participants: PracticumParticipant[],
  attendance: PracticumAttendance[],
  sessionStatus: PracticumSession['status'],
): ParticipantItem[] {
  const byUser = new Map(attendance.map((item) => [item.userId, item]));
  const closed = sessionStatus === 'closed' || sessionStatus === 'cancelled';
  return participants.map((participant) => {
    const record = byUser.get(participant.userId) ?? null;
    const status = record ? 'present' : closed ? 'absent' : 'pending';
    return {
      id: participant.userId,
      name: participant.studentName,
      nim: participant.studentNumber,
      group: '',
      status,
      statusLabel: attendanceStatusLabels[status],
      attendedAtLabel: record ? timestampTimeLabel(record.recordedAt) : null,
    };
  });
}

export function toAttendanceSummary(
  participants: PracticumParticipant[],
  attendance: PracticumAttendance[],
): AttendanceSummary {
  const participantIds = new Set(participants.map((item) => item.userId));
  const present = attendance.filter((item) => participantIds.has(item.userId)).length;
  return {
    total: participants.length,
    present,
    notPresent: participants.length - present,
  };
}

export function toAssistantRecapItems(
  classes: readonly PracticumClass[],
  schedules: readonly PracticumSchedule[],
  sessions: readonly PracticumSession[],
  attendanceBySession: Readonly<Record<string, readonly PracticumAttendance[]>>,
): SessionWithSummary[] {
  const classById = new Map(classes.map((item) => [item.id, item]));
  const scheduleById = new Map(schedules.map((item) => [item.id, item]));

  return [...sessions]
    .sort((left, right) => left.startAt.toMillis() - right.startAt.toMillis())
    .flatMap((session) => {
      const classItem = classById.get(session.classId);
      if (!classItem) return [];
      const participantIds = new Set(session.studentIds);
      const present = (attendanceBySession[session.id] ?? []).filter((record) =>
        participantIds.has(record.userId),
      ).length;
      const total = session.studentIds.length;
      return [
        {
          session: toAssistantSessionItem(
            session,
            classItem,
            scheduleById.get(session.scheduleId) ?? null,
          ),
          summary: {
            total,
            present,
            notPresent: total - present,
          },
        },
      ];
    });
}

export const RECAP_STATUS_LABEL: Record<PracticumRecapStatus, string> = {
  present: 'Hadir',
  excused: 'Izin',
  absent: 'Tidak Hadir',
  pending: 'Izin Menunggu',
  'belum-presensi': 'Belum Presensi',
};

export const RECAP_STATUS_TONE: Record<
  PracticumRecapStatus,
  'neutral' | 'info' | 'success' | 'warning' | 'danger'
> = {
  present: 'success',
  excused: 'info',
  absent: 'danger',
  pending: 'warning',
  'belum-presensi': 'neutral',
};

export function recapTimeLabel(entry: PracticumRecapEntry): string | null {
  return entry.attendance ? timestampTimeLabel(entry.attendance.recordedAt) : null;
}
