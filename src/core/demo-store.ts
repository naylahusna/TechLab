import { createInitialDemoState } from './demo-data';
import { transitionDemo, type DemoAction } from './demo-state';
import type { Role } from './roles';

/** Each provider owns one store; identity changes preserve the other snapshot fields. */
export function createDemoStore() {
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
    selectUser: (userId: string, role?: Role) => dispatch({ type: 'select-user', userId, role }).ok,
    openSession: (sessionId: string) => dispatch({ type: 'open-session', sessionId }),
    closeSession: (sessionId: string) => dispatch({ type: 'close-session', sessionId }),
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
