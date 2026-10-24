import assert from 'node:assert/strict';
import test from 'node:test';

import { initialIdentity, selectIdentity } from '../src/core/identity-state';
import type { Role } from '../src/core/roles';
import { findUser, usersForRole } from '../src/core/users';

test('every listed identity can be selected for its role and resolves to the same user', () => {
  for (const role of ['praktikan', 'asisten'] as const) {
    const available = usersForRole(role);
    assert.ok(available.length > 1);
    for (const user of available) {
      const selected = selectIdentity(initialIdentity, user.id, role);
      assert.deepEqual(selected, { currentUserId: user.id, currentRole: role });
      assert.equal(findUser(selected.currentUserId), user);
    }
  }
});

test('an unknown identity or mismatched role cannot replace the selected identity', () => {
  const active = selectIdentity(initialIdentity, 'praktikan-01', 'praktikan');
  assert.equal(selectIdentity(active, 'unknown', 'praktikan'), active);
  assert.equal(selectIdentity(active, 'asisten-01', 'praktikan'), active);
  assert.equal(selectIdentity(active, 'praktikan-02', 'admin' as Role), active);
  assert.deepEqual(initialIdentity, { currentUserId: null, currentRole: null });
});

test('switching changes user and role together and leaves the previous selection intact', () => {
  const alya = selectIdentity(initialIdentity, 'praktikan-01', 'praktikan');
  const bima = selectIdentity(alya, 'praktikan-02', 'praktikan');
  const assistant = selectIdentity(bima, 'asisten-01', 'asisten');
  const returned = selectIdentity(assistant, 'praktikan-01', 'praktikan');
  assert.deepEqual(bima, { currentUserId: 'praktikan-02', currentRole: 'praktikan' });
  assert.deepEqual(assistant, { currentUserId: 'asisten-01', currentRole: 'asisten' });
  assert.deepEqual(returned, alya);
  assert.deepEqual(alya, { currentUserId: 'praktikan-01', currentRole: 'praktikan' });
  assert.equal(selectIdentity(alya, 'praktikan-01', 'praktikan'), alya);
});
