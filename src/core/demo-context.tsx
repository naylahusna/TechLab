import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from 'react';

import { createDemoStore, type DemoStore } from './demo-store';
import { selectCurrentUser } from './selectors';

const DemoContext = createContext<DemoStore | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => createDemoStore());
  return <DemoContext.Provider value={store}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const store = useContext(DemoContext);
  if (!store) throw new Error('useDemo must be used inside DemoProvider');
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  return { ...state, currentUser: selectCurrentUser(state), ...store.actions };
}
