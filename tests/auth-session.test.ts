import assert from 'node:assert/strict';
import test from 'node:test';
import { createSessionStore, type Account } from '../src/features/auth/session-store';
import {
  authErrorMessage,
  parseProfile,
  validateCredentials,
  validateProfile,
  type UserProfile,
} from '../src/features/auth/model';

const profile = (uid: string): UserProfile => ({
  uid,
  name: 'Nama Praktikan',
  number: '240001',
  role: 'praktikan',
});
function setup() {
  let accountChanged!: (account: Account | null) => void;
  const observers: {
    next: (profile: UserProfile | null, cache: boolean) => void;
    fail: (error: unknown) => void;
    stopped: boolean;
  }[] = [];
  let authStopped = false;
  const store = createSessionStore({
    observeAccount: (next) => {
      accountChanged = next;
      return () => {
        authStopped = true;
      };
    },
    observeProfile: (_uid, next, fail) => {
      const observer = { next, fail, stopped: false };
      observers.push(observer);
      return () => {
        observer.stopped = true;
      };
    },
    message: authErrorMessage,
  });
  const stop = store.start();
  return {
    store,
    observers,
    change: (uid: string | null) =>
      accountChanged(uid ? { uid, email: `${uid}@example.com` } : null),
    stop,
    authStopped: () => authStopped,
  };
}

test('restores identity only after profile arrives and follows role changes', () => {
  const s = setup();
  assert.equal(s.store.getSnapshot().status, 'loading');
  s.change('a');
  assert.equal(s.store.getSnapshot().profile, null);
  s.observers[0].next(null, true);
  assert.equal(s.store.getSnapshot().status, 'profile-loading');
  s.observers[0].next(profile('a'), false);
  assert.equal(s.store.getSnapshot().status, 'ready');
  s.observers[0].next({ ...profile('a'), role: 'asisten' }, false);
  assert.equal(s.store.getSnapshot().profile?.role, 'asisten');
  s.observers[0].next(null, false);
  assert.equal(s.store.getSnapshot().status, 'missing-profile');
  s.stop();
  assert.ok(s.authStopped());
  assert.ok(s.observers[0].stopped);
});
test('logout/account switch ignores late profile and error callbacks from old account', () => {
  const s = setup();
  s.change('a');
  s.observers[0].next(profile('a'), false);
  s.store.suspend();
  assert.equal(s.store.getSnapshot().profile, null);
  s.observers[0].next(profile('a'), false);
  assert.equal(s.store.getSnapshot().profile, null);
  s.change(null);
  assert.equal(s.store.getSnapshot().status, 'signed-out');
  s.change('b');
  s.observers[0].fail(new Error('late'));
  s.observers[0].next(profile('a'), false);
  assert.equal(s.store.getSnapshot().account?.uid, 'b');
  assert.equal(s.store.getSnapshot().profile, null);
  s.observers[1].next(profile('b'), false);
  assert.equal(s.store.getSnapshot().profile?.uid, 'b');
  s.stop();
  s.observers[1].next(profile('a'), false);
  assert.equal(s.store.getSnapshot().profile?.uid, 'b');
});
test('profile failures fail closed and retry detaches the failed listener', () => {
  const s = setup();
  s.change('a');
  s.observers[0].next(profile('a'), false);
  s.observers[0].fail({ code: 'permission-denied' });
  assert.equal(s.store.getSnapshot().status, 'error');
  assert.equal(s.store.getSnapshot().profile, null);
  s.store.retry();
  assert.ok(s.observers[0].stopped);
  s.observers[1].next(profile('a'), false);
  assert.equal(s.store.getSnapshot().status, 'ready');
  s.stop();
});
test('input and profile validation reject role/UID spoofing and malformed fields', () => {
  assert.equal(validateCredentials(' STUDENT@EXAMPLE.COM ', 'secret', true), 'student@example.com');
  assert.throws(() => validateCredentials('wrong', 'secret'));
  assert.throws(() => validateCredentials('a@example.com', '123', true));
  assert.deepEqual(validateProfile({ name: '  Nama Lengkap ', number: '240001' }), {
    name: 'Nama Lengkap',
    number: '240001',
  });
  assert.throws(() => validateProfile({ name: 'a', number: '1' }));
  assert.throws(() => validateProfile({ name: 'Valid Name', number: 'x'.repeat(33) }));
  assert.throws(() => parseProfile('a', { ...profile('a'), role: 'admin' }));
  assert.throws(() => parseProfile('b', profile('a')));
  assert.equal(
    authErrorMessage({ code: 'auth/invalid-credential' }),
    'Email atau password tidak sesuai.',
  );
});
