import type { UserProfile } from './model';

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
  let stopProfile: (() => void) | undefined;
  let stopAccount: (() => void) | undefined;
  const listeners = new Set<() => void>();
  const publish = (next: SessionState) => {
    state = next;
    listeners.forEach((fn) => fn());
  };
  function follow(account: Account | null) {
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
          publish({
            status: profile ? 'ready' : 'missing-profile',
            account,
            profile,
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
  return {
    getSnapshot: () => state,
    subscribe: (fn: () => void) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    start: () => {
      stopAccount = adapter.observeAccount(follow, (error) => {
        ++generation;
        stopProfile?.();
        publish({
          status: 'error',
          account: null,
          profile: null,
          error: adapter.message(error),
          fromCache: false,
        });
      });
      return () => {
        ++generation;
        stopProfile?.();
        stopAccount?.();
      };
    },
    retry: () => follow(state.account),
    // Prevent callbacks/data from a previous user from reaching the UI during logout.
    suspend: () => {
      ++generation;
      stopProfile?.();
      publish({ ...state, status: 'loading', profile: null, error: null });
    },
  };
}
