import {
  collection, doc, getDocsFromServer, onSnapshot, query, runTransaction, serverTimestamp, where,
} from 'firebase/firestore';

import { parseProfile, type RejectionReason, type UserProfile } from '../auth/model';
import { getFirebaseFirestore } from '../../services/firebase/firestore';

const managedRoles = ['calon_asprak', 'asisten', 'asprak_ditolak', 'asprak_dicabut'];
type NextRole = 'asisten' | 'asprak_ditolak' | 'asprak_dicabut';
export type RoleChange = { user: UserProfile; nextRole: NextRole; rejectionReason?: RejectionReason };

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

export async function changeUserRole({ user, nextRole, rejectionReason }: RoleChange) {
  const db = getFirebaseFirestore();
  const profile = doc(db, 'users', user.uid);
  const directory = doc(db, 'userDirectory', user.uid);
  let practitionerUid: string | undefined;
  if (nextRole === 'asisten' || rejectionReason === 'no_practitioner_account') {
    const candidates = await getDocsFromServer(query(
      collection(db, 'userDirectory'),
      where('role', '==', 'praktikan'),
      where('number', '==', user.number),
    ));
    const matches = candidates.docs.filter((entry) => entry.data().name === user.name);
    if (nextRole === 'asisten') {
      if (matches.length === 0) throw new Error('Akun Praktikan dengan nama dan NIM yang sama belum ditemukan. Cek datanya sebelum memilih alasan penolakan.');
      if (matches.length > 1) throw new Error('Lebih dari satu akun Praktikan cocok. Periksa identitas sebelum menyetujui.');
      practitionerUid = matches[0].id;
    } else if (matches.length > 0) {
      throw new Error('Akun Praktikan yang cocok sudah ada. Pilih alasan penolakan lain jika diperlukan.');
    }
  }

  await runTransaction(db, async (transaction) => {
    const current = (await transaction.get(directory)).data();
    if (!current || current.role !== user.role || current.name !== user.name || current.number !== user.number || current.rejectionReason !== user.rejectionReason) {
      throw new Error('Data akun sudah berubah. Periksa daftar terbaru.');
    }
    const changes = { role: nextRole, updatedAt: serverTimestamp(), ...(rejectionReason ? { rejectionReason } : {}) };
    transaction.update(profile, practitionerUid ? { ...changes, practitionerUid } : changes);
    transaction.update(directory, changes);
  });
}
