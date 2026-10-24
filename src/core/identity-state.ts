import { isRole, type Role } from './roles';
import { findUser } from './users';

export type IdentityState = Readonly<{
  currentRole: Role | null;
  currentUserId: string | null;
}>;

export const initialIdentity: IdentityState = Object.freeze({ currentRole: null, currentUserId: null });

/** The role and identity are committed together, only after confirmation. */
export function selectIdentity(state: IdentityState, userId: string, role: Role): IdentityState {
  if (!isRole(role)) return state;
  const user = findUser(userId);
  if (!user || user.role !== role) return state;
  if (state.currentUserId === user.id && state.currentRole === user.role) return state;
  return Object.freeze({ currentUserId: user.id, currentRole: user.role });
}
