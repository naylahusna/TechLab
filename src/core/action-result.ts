import type { ActionErrorCode, ActionResult } from './types';

export function failure(code: ActionErrorCode, message: string): ActionResult {
  return Object.freeze({ ok: false, code, message });
}

export function success(message: string): ActionResult {
  return Object.freeze({ ok: true, message });
}
