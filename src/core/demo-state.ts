import { createInitialDemoState } from './demo-data';
import { selectIdentity } from './identity-state';
import { failure, success } from './action-result';
import type { Role } from './roles';
import type { ActionResult, DemoState } from './types';

export type DemoAction =
  Readonly<{ type: 'select-user'; userId: string; role?: Role }> | Readonly<{ type: 'reset-demo' }>;

type Transition = Readonly<{ state: DemoState; result: ActionResult }>;

export function transitionDemo(state: DemoState, action: DemoAction): Transition {
  switch (action.type) {
    case 'select-user': {
      const user = state.users.find((item) => item.id === action.userId);
      if (!user) return { state, result: failure('INVALID_USER', 'Identitas tidak ditemukan.') };
      const role = action.role === undefined ? user.role : action.role;
      if (role !== user.role) {
        return { state, result: failure('ROLE_MISMATCH', 'Identitas tidak sesuai dengan peran.') };
      }
      const identity = selectIdentity(state, user.id, role);
      return {
        state: identity === state ? state : Object.freeze({ ...state, ...identity }),
        result: success('Pengguna aktif diperbarui.'),
      };
    }
    case 'reset-demo':
      return { state: createInitialDemoState(), result: success('Data demo berhasil direset.') };
    default:
      return { state, result: failure('INVALID_ACTION', 'Tindakan tidak dikenali.') };
  }
}
