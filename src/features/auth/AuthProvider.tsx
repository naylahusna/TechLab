import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { getFirebaseAuth } from '../../services/firebase/auth';
import { getFirebaseFirestore } from '../../services/firebase/firestore';
import {
  authErrorMessage,
  parseProfile,
  validateCredentials,
  validateProfile,
  type ProfileFields,
} from './model';
import { createOwnProfile, updateOwnProfile } from './profile-service';
import { createSessionStore } from './session-store';

function createAuthSession() {
  return createSessionStore({
    observeAccount: (next, fail) => {
      try {
        return onAuthStateChanged(getFirebaseAuth(), next, fail);
      } catch (error) {
        fail(error);
        return () => {};
      }
    },
    observeProfile: (uid, next, fail) =>
      onSnapshot(
        doc(getFirebaseFirestore(), 'users', uid),
        { includeMetadataChanges: true },
        (snapshot) => {
          try {
            next(
              snapshot.exists() ? parseProfile(uid, snapshot.data()) : null,
              snapshot.metadata.fromCache,
            );
          } catch (error) {
            fail(error);
          }
        },
        fail,
      ),
    message: authErrorMessage,
  });
}

function useAuthSession() {
  const [store] = useState(createAuthSession);
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const [provisioning, setProvisioning] = useState(false);
  // Keep operation errors above route/boundary unmounts during account changes.
  const [actionError, setActionError] = useState('');
  useEffect(() => store.start(), [store]);
  const actions = useMemo(
    () => ({
      async login(email: string, password: string) {
        setActionError('');
        await signInWithEmailAndPassword(
          getFirebaseAuth(),
          validateCredentials(email, password),
          password,
        );
      },
      async register(email: string, password: string, fields: ProfileFields) {
        const normalized = validateCredentials(email, password, true);
        const clean = validateProfile(fields);
        setActionError('');
        setProvisioning(true);
        let accountCreated = false;
        try {
          const { user } = await createUserWithEmailAndPassword(
            getFirebaseAuth(),
            normalized,
            password,
          );
          accountCreated = true;
          await createOwnProfile(user.uid, clean);
        } catch (error) {
          if (accountCreated)
            setActionError(
              `Akun sudah dibuat, tetapi profil belum berhasil disimpan. ${authErrorMessage(error)}`,
            );
          throw error;
        } finally {
          setProvisioning(false);
        }
      },
      async completeProfile(fields: ProfileFields) {
        setActionError('');
        const user = getFirebaseAuth().currentUser;
        if (!user) throw new Error('Silakan login kembali.');
        await createOwnProfile(user.uid, fields);
      },
      async saveProfile(fields: ProfileFields) {
        const user = getFirebaseAuth().currentUser;
        if (!user) throw new Error('Silakan login kembali.');
        await updateOwnProfile(user.uid, fields);
      },
      async logout() {
        setActionError('');
        store.suspend();
        try {
          await signOut(getFirebaseAuth());
        } catch (error) {
          setActionError(`Gagal keluar dari akun. ${authErrorMessage(error)}`);
          store.retry();
          throw error;
        }
      },
      retry: () => {
        setActionError('');
        store.retry();
      },
      selectRole: store.selectRole,
    }),
    [store],
  );
  return { ...state, provisioning, actionError, ...actions };
}

const AuthContext = createContext<ReturnType<typeof useAuthSession> | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useAuthSession();
  return <AuthContext.Provider value={session}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const session = useContext(AuthContext);
  if (!session) throw new Error('useAuth must be used inside AuthProvider');
  return session;
}
