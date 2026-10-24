import { validateSessionAction } from '../../core/rules';
import {
  selectAttendanceSummary,
  selectCurrentUser,
  selectMySession,
  selectMySessions,
  selectSessionParticipants,
} from '../../core/selectors';
import type { DemoState } from '../../core/types';

export type AttendanceFilter = 'all' | 'present' | 'not-present';

/** Read-only views of the shared snapshot; never seed or store assistant-only data. */
export function selectAssistantSessions(state: DemoState) {
  if (selectCurrentUser(state)?.role !== 'asisten') return [];
  return [...selectMySessions(state)]
    .sort((left, right) => Date.parse(left.startsAt) - Date.parse(right.startsAt))
    .map((session) => ({ session, summary: selectAttendanceSummary(state, session.id)! }));
}

export function selectAssistantSession(
  state: DemoState,
  sessionId: string,
  filter: AttendanceFilter = 'all',
) {
  if (selectCurrentUser(state)?.role !== 'asisten') return null;
  const session = selectMySession(state, sessionId);
  const summary = selectAttendanceSummary(state, sessionId);
  if (!session || !summary) return null;
  const participants = selectSessionParticipants(state, sessionId);
  return {
    session,
    summary,
    participants,
    filteredParticipants: participants.filter(
      (entry) => filter === 'all' || (filter === 'present' ? !!entry.record : !entry.record),
    ),
    notPresentLabel: session.status === 'closed' ? 'Tidak Hadir' : 'Belum Hadir',
    canOpen: validateSessionAction(state, sessionId, 'open').ok,
    canClose: validateSessionAction(state, sessionId, 'close').ok,
  };
}

export function formatSessionDate(value: string) {
  return new Date(value).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatAttendanceTime(value: string) {
  return new Date(value)
    .toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    .replace(':', '.');
}

export function formatSessionTimeRange(startsAt: string, endsAt: string) {
  return `${formatAttendanceTime(startsAt)} – ${formatAttendanceTime(endsAt)}`;
}
