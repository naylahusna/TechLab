import { createContext, useContext, useState, type ReactNode } from 'react';

import { isRole, type Role } from './roles';

type RoleContextValue = {
  currentRole: Role | null;
  selectRole: (role: Role) => void;
};

const RoleContext = createContext<RoleContextValue | null>(null);

/** Mount above screens so later screen changes need not reset the role. */
export function RoleProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<Role | null>(null);

  function selectRole(role: Role) {
    if (isRole(role)) setCurrentRole(role);
  }

  return (
    <RoleContext.Provider value={{ currentRole, selectRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) throw new Error('useRole must be used inside RoleProvider');
  return context;
}
