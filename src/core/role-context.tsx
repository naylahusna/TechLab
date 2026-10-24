import { createContext, useContext, useState, type ReactNode } from 'react';

import { initialIdentity, selectIdentity, type IdentityState } from './identity-state';
import type { Role } from './roles';
import { findUser, users, type DemoUser } from './users';

type RoleContextValue = {
  currentRole: Role | null;
  currentUserId: string | null;
  currentUser: DemoUser | null;
  users: readonly DemoUser[];
  selectUser: (userId: string, role: Role) => boolean;
};

const RoleContext = createContext<RoleContextValue | null>(null);

/** Mount above screens so later screen changes need not reset the role. */
export function RoleProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<IdentityState>(initialIdentity);

  function selectUser(userId: string, role: Role) {
    const user = findUser(userId);
    if (!user || user.role !== role) return false;
    setIdentity((previous) => selectIdentity(previous, userId, role));
    return true;
  }

  return (
    <RoleContext.Provider value={{ ...identity, currentUser: findUser(identity.currentUserId), users, selectUser }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) throw new Error('useRole must be used inside RoleProvider');
  return context;
}
