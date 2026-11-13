import { useAuth, AuthProvider } from '../features/auth/AuthProvider';
import type { ActionResult, DemoState } from './types';

/** Compatibility API for Sprint 1 screens. Never maps Firebase UIDs to seed users.
 * Programmer 2 will replace empty practicum arrays/actions with Firestore repositories.
 */
export const DemoProvider = AuthProvider;
const unavailable = (..._args: string[]): ActionResult => ({
  ok: false,
  code: 'INVALID_ACTION',
  message: 'Data praktikum belum tersedia.',
});
export function useDemo() {
  const { profile } = useAuth();
  const currentUser = profile
    ? {
        id: profile.uid,
        name: profile.name,
        role: profile.role,
        number: profile.number,
        group: 'Belum ada penugasan kelas',
        initials: profile.name
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part[0])
          .join('')
          .toUpperCase(),
      }
    : null;
  const state: DemoState = {
    currentUserId: currentUser?.id ?? null,
    currentRole: currentUser?.role ?? null,
    users: currentUser ? [currentUser] : [],
    sessions: [],
    attendanceRecords: [],
  };
  return {
    ...state,
    currentUser,
    selectUser: (..._args: unknown[]) => false,
    openSession: unavailable,
    closeSession: unavailable,
    recordAttendance: unavailable,
    resetDemo: unavailable,
  };
}
