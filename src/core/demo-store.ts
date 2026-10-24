import { createInitialDemoState } from './demo-data';
import { transitionDemo, type DemoAction } from './demo-state';
import type { Role } from './roles';

/** A provider owns one instance. Every action synchronously checks the latest snapshot. */
export function createDemoStore({
  now = () => new Date().toISOString(),
}: { now?: () => string } = {}) {
  let state = createInitialDemoState();
  const listeners = new Set<() => void>();

  function dispatch(action: DemoAction) {
    const next = transitionDemo(state, action);
    if (next.state !== state) {
      state = next.state;
      listeners.forEach((listener) => listener());
    }
    return next.result;
  }

  const actions = Object.freeze({
    // Boolean return stays compatible with the SRS-02 identity selection screen.
    selectUser: (userId: string, role?: Role) => dispatch({ type: 'select-user', userId, role }).ok,
    openSession: (sessionId: string) => dispatch({ type: 'open-session', sessionId }),
    closeSession: (sessionId: string) => dispatch({ type: 'close-session', sessionId }),
    recordAttendance: (sessionId: string, studentId: string) =>
      dispatch({
        type: 'record-attendance',
        sessionId,
        studentId,
        recordedAt: now(),
      }),
    resetDemo: () => dispatch({ type: 'reset-demo' }),
  });

  return Object.freeze({
    getSnapshot: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    actions,
  });
}

export type DemoStore = ReturnType<typeof createDemoStore>;
