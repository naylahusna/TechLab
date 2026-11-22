import type {
  AttendanceStatus as CoreAttendanceStatus,
  SessionStatus as CoreSessionStatus,
} from '../../core/types';
import type { AttendanceOverrideStatus } from '../practicum/types';

export type AttendanceFilter = 'semua' | 'hadir' | 'izin' | 'belum-hadir';

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
  status: CoreAttendanceStatus | 'excused';
  statusLabel: string;
  attendedAtLabel: string | null;
  permissionStatus?: 'pending' | 'approved' | 'rejected';
  hasRecordedAttendance?: boolean;
  overrideStatus?: AttendanceOverrideStatus;
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
