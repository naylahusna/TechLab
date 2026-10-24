import assert from 'node:assert/strict';
import test from 'node:test';

import { initialIdentity, selectIdentity } from '../src/core/identity-state';
import { navigationFor } from '../src/core/navigation';
import { findUser } from '../src/core/users';

test('switching between users derives the correct menu without retaining the previous role', () => {
  let state = initialIdentity;
  for (const [userId, role, expected] of [
    ['praktikan-01', 'praktikan', 'Riwayat'],
    ['asisten-01', 'asisten', 'Rekap'],
    ['asisten-02', 'asisten', 'Rekap'],
    ['praktikan-02', 'praktikan', 'Riwayat'],
  ] as const) {
    state = selectIdentity(state, userId, role);
    const currentUser = findUser(state.currentUserId);
    assert.ok(currentUser);
    assert.equal(currentUser.role, state.currentRole);
    const menu = navigationFor(currentUser.role);
    assert.equal(menu.catatan.label, expected);
    assert.equal(menu.jadwal.label, role === 'praktikan' ? 'Jadwal' : 'Sesi Saya');
    assert.equal(menu.profil.label, 'Profil');
  }
});
