import { assistantSessions } from '../features/assistant/assistant-sessions';

export type SessionStatus = 'Akan datang' | 'Sedang berlangsung' | 'Selesai';
export type SessionState = Readonly<Record<string, SessionStatus>>;

export const initialSessionState: SessionState = Object.freeze(
  Object.fromEntries(assistantSessions.map((session) => [session.id, session.status])),
);

/** Open a scheduled session once; an open or completed session cannot be reopened. */
export function openSession(state: SessionState, sessionId: string): SessionState {
  if (!Object.hasOwn(state, sessionId) || state[sessionId] !== 'Akan datang') return state;
  return { ...state, [sessionId]: 'Sedang berlangsung' };
}
