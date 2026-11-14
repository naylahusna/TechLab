import { profileWithRole, type UserProfile } from './model';
import type { Role } from '../../core/roles';

export type Account = { uid: string; email: string | null };
export type SessionState = {
  status: 'loading' | 'signed-out' | 'profile-loading' | 'missing-profile' | 'ready' | 'error';
  account: Account | null;
  profile: UserProfile | null;
  error: string | null;
  fromCache: boolean;
};
export type SessionAdapter = {
  observeAccount: (
    next: (account: Account | null) => void,
    fail: (error: unknown) => void,
  ) => () => void;
  observeProfile: (
    uid: string,
    next: (profile: UserProfile | null, fromCache: boolean) => void,
    fail: (error: unknown) => void,
  ) => () => void;
  message: (error: unknown) => string;
};

// Independent of React/Firebase so lifecycle races can be exercised in unit tests.
export function createSessionStore(adapter: SessionAdapter) {
  let state: SessionState = {
    status: 'loading',
    account: null,
    profile: null,
    error: null,
    fromCache: false,
  };
  let generation = 0;
  let accountGeneration = 0;
  let started = false;
  let roleSelection: { uid: string; role: Role } | null = null;
  let assignedProfile: UserProfile | null = null;
  let stopProfile: (() => void) | undefined;
  let stopAccount: (() => void) | undefined;
  const listeners = new Set<() => void>();
  const publish = (next: SessionState) => {
    state = next;
    listeners.forEach((fn) => fn());
  };
  function follow(account: Account | null) {
    if (!account || account.uid !== state.account?.uid) roleSelection = null;
    assignedProfile = null;
    const version = ++generation;
    stopProfile?.();
    stopProfile = undefined;
    publish({
      status: account ? 'profile-loading' : 'signed-out',
      account,
      profile: null,
      error: null,
      fromCache: false,
    });
    if (!account) return;
    try {
      stopProfile = adapter.observeProfile(
        account.uid,
        (profile, fromCache) => {
          if (generation !== version) return;
          // An empty local cache is not proof that a profile is missing on the server.
          if (!profile && fromCache) return;
          assignedProfile = profile;
          if (profile && roleSelection && !profile.roles.includes(roleSelection.role))
            roleSelection = null;
          const activeProfile =
            profile && roleSelection?.uid === account.uid
              ? profileWithRole(profile, roleSelection.role)
              : profile;
          publish({
            status: profile ? 'ready' : 'missing-profile',
            account,
            profile: activeProfile,
            error: null,
            fromCache,
          });
        },
        (error) => {
          if (generation === version)
            publish({
              status: 'error',
              account,
              profile: null,
              error: adapter.message(error),
              fromCache: false,
            });
        },
      );
    } catch (error) {
      publish({
        status: 'error',
        account,
        profile: null,
        error: adapter.message(error),
        fromCache: false,
      });
    }
  }
  function watchAccount() {
    const version = ++accountGeneration;
    stopAccount?.();
    stopAccount = undefined;
    const fail = (error: unknown) => {
      if (!started || version !== accountGeneration) return;
      ++generation;
      stopProfile?.();
      stopProfile = undefined;
      publish({
        status: 'error',
        account: null,
        profile: null,
        error: adapter.message(error),
        fromCache: false,
      });
    };
    try {
      stopAccount = adapter.observeAccount((account) => {
        if (started && version === accountGeneration) follow(account);
      }, fail);
    } catch (error) {
      fail(error);
    }
  }
  return {
    getSnapshot: () => state,
    selectRole: (role: Role) => {
      if (state.status !== 'ready' || !assignedProfile)
        throw new Error('Muat ulang akun sebelum memilih peran.');
      const profile = profileWithRole(assignedProfile, role);
      roleSelection = { uid: profile.uid, role };
      publish({ ...state, profile });
    },
    subscribe: (fn: () => void) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    start: () => {
      started = true;
      watchAccount();
      return () => {
        started = false;
        ++accountGeneration;
        ++generation;
        stopProfile?.();
        stopAccount?.();
      };
    },
    retry: () => {
      if (state.account) follow(state.account);
      else if (started) {
        publish({ ...state, status: 'loading', error: null });
        watchAccount();
      }
    },
    // Prevent callbacks/data from a previous user from reaching the UI during logout.
    suspend: () => {
      ++generation;
      stopProfile?.();
      publish({ ...state, status: 'loading', profile: null, error: null });
    },
  };
}
