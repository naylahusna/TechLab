import {
  collection, doc, onSnapshot, orderBy, query, runTransaction, serverTimestamp,
} from 'firebase/firestore';

import { parseProfile, type UserProfile } from '../auth/model';
import { getFirebaseFirestore } from '../../services/firebase/firestore';

export type ManagedRole = Exclude<UserProfile['role'], 'admin'>;
export type RoleChange = { user: UserProfile; nextRole: ManagedRole };

export function watchUsers(onData: (users: UserProfile[], fromCache: boolean) => void, onError: (error: Error) => void) {
  const directory = query(collection(getFirebaseFirestore(), 'userDirectory'), orderBy('name'));
  return onSnapshot(directory, { includeMetadataChanges: true }, (snapshot) => {
    try {
      onData(snapshot.docs.map((entry) => parseProfile(entry.id, entry.data())), snapshot.metadata.fromCache);
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Direktori pengguna tidak valid.'));
    }
  }, onError);
}

export async function changeUserRole({ user, nextRole }: RoleChange) {
  const db = getFirebaseFirestore();
  const profile = doc(db, 'users', user.uid);
  const directory = doc(db, 'userDirectory', user.uid);
  await runTransaction(db, async (transaction) => {
    const current = await transaction.get(directory);
    if (!current.exists() || current.data().role !== user.role || user.role === 'admin' || user.role === nextRole) {
      throw new Error('Peran akun sudah berubah atau akun tidak dapat dikelola. Periksa daftar terbaru.');
    }
    const changes = { role: nextRole, updatedAt: serverTimestamp() };
    transaction.update(profile, changes);
    transaction.update(directory, changes);
  });
}
