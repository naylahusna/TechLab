import type {
  AttendanceStatus as CoreAttendanceStatus,
  SessionStatus as CoreSessionStatus,
} from '../../core/types';

export type AttendanceFilter = 'semua' | 'hadir' | 'belum-hadir';

export type AssistantBadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export type AssistantSessionItem = {
  id: string;
  practicalName: string;
  meetingLabel: string;
  className: string;
  lab: string;
  dateLabel: string;
  timeRangeLabel: string;
  status: CoreSessionStatus;
  statusLabel: string;
  studentCount: number;
  canOpenSession?: boolean;
  openWindowMessage?: string | null;
};

export type ParticipantItem = {
  id: string;
  name: string;
  nim: string;
  group: string;
  status: CoreAttendanceStatus;
  statusLabel: string;
  attendedAtLabel: string | null;
  permissionStatus?: 'pending' | 'approved' | 'rejected';
};

export type AttendanceSummary = {
  total: number;
  present: number;
  notPresent: number;
};

export type SessionWithSummary = {
  session: AssistantSessionItem;
  summary: AttendanceSummary;
};
