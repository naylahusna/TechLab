import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerPush } from '../src/features/notifications/registration';
function services() {
  const calls: string[] = [];
  return {
    calls,
    supported: true,
    active: () => true,
    prepare: async () => {
      calls.push('channel');
    },
    permission: async () => ({ granted: false, canAskAgain: true }),
    request: async () => ({ granted: true, canAskAgain: false }),
    token: async () => 'ExpoPushToken[device]',
    save: async (token: string) => {
      calls.push(token);
    },
    revoke: async () => {
      calls.push('revoke');
    },
  };
}
test('push permission/channel registration handles granted, denied, unsupported and network errors', async () => {
  const allowed = services();
  assert.equal(await registerPush(allowed), 'ready');
  assert.deepEqual(allowed.calls, ['channel', 'ExpoPushToken[device]']);
  const denied = services();
  denied.request = async () => ({ granted: false, canAskAgain: false });
  assert.equal(await registerPush(denied), 'denied');
  assert.deepEqual(denied.calls, ['channel', 'revoke']);
  const unsupported = services();
  unsupported.supported = false;
  assert.equal(await registerPush(unsupported), 'unsupported');
  assert.deepEqual(unsupported.calls, []);
  const offline = services();
  offline.token = async () => {
    throw new Error('offline');
  };
  assert.equal(await registerPush(offline), 'error');
  assert.deepEqual(offline.calls, ['channel']);
});
test('denied permission is not repeatedly requested and account changes prevent token saving', async () => {
  const denied = services();
  denied.permission = async () => ({ granted: false, canAskAgain: false });
  denied.request = async () => {
    throw new Error('must not prompt');
  };
  assert.equal(await registerPush(denied), 'denied');
  const changed = services();
  changed.active = () => false;
  assert.equal(await registerPush(changed), 'error');
  assert.deepEqual(changed.calls, ['channel']);
});
test('a stalled token service times out and a late response cannot register after timeout', async () => {
  const stalled = services();
  let finish!: (token: string) => void;
  stalled.token = () => new Promise<string>((resolve) => { finish = resolve; });
  assert.equal(await registerPush(stalled, 10), 'error');
  finish('ExpoPushToken[late]');
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(stalled.calls, ['channel']);
});
