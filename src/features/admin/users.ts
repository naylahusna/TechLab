import {
  collection, doc, getDocsFromServer, onSnapshot, query, runTransaction, serverTimestamp, where,
} from 'firebase/firestore';

import { parseProfile, type UserProfile } from '../auth/model';
import { getFirebaseFirestore } from '../../services/firebase/firestore';

const managedRoles = ['calon_asprak', 'asisten', 'asprak_ditolak', 'asprak_dicabut'];
type NextRole = 'asisten' | 'asprak_ditolak' | 'asprak_dicabut';
export type RoleChange = { user: UserProfile; nextRole: NextRole };

export function watchUsers(onData: (users: UserProfile[], fromCache: boolean) => void, onError: (error: Error) => void) {
  const directory = query(collection(getFirebaseFirestore(), 'userDirectory'), where('role', 'in', managedRoles));
  return onSnapshot(directory, { includeMetadataChanges: true }, (snapshot) => {
    try {
      const users = snapshot.docs.map((entry) => parseProfile(entry.id, entry.data()));
      users.sort((a, b) => a.name.localeCompare(b.name, 'id'));
      onData(users, snapshot.metadata.fromCache);
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Direktori pengguna tidak valid.'));
    }
  }, onError);
}

export async function changeUserRole({ user, nextRole }: RoleChange) {
  const db = getFirebaseFirestore();
  const profile = doc(db, 'users', user.uid);
  const directory = doc(db, 'userDirectory', user.uid);
  let practitionerUid: string | undefined;
  if (nextRole === 'asisten') {
    const candidates = await getDocsFromServer(query(
      collection(db, 'userDirectory'),
      where('role', '==', 'praktikan'),
      where('number', '==', user.number),
    ));
    const matches = candidates.docs.filter((entry) => entry.data().name === user.name);
    if (matches.length === 0) throw new Error('Nama dan NIM tidak cocok dengan akun praktikan. Periksa data pengajuan.');
    if (matches.length > 1) throw new Error('Lebih dari satu akun praktikan cocok. Periksa identitas sebelum menyetujui.');
    practitionerUid = matches[0].id;
  }

  await runTransaction(db, async (transaction) => {
    const current = (await transaction.get(directory)).data();
    if (!current || current.role !== user.role || current.name !== user.name || current.number !== user.number) {
      throw new Error('Data akun sudah berubah. Periksa daftar terbaru.');
    }
    const changes = { role: nextRole, updatedAt: serverTimestamp() };
    transaction.update(profile, practitionerUid ? { ...changes, practitionerUid } : changes);
    transaction.update(directory, changes);
  });
}
