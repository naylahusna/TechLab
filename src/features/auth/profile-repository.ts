import { doc, runTransaction, serverTimestamp, type Firestore } from 'firebase/firestore';
import { validateProfile, type ProfileFields } from './model';

export function createProfileRepository(db: Firestore) {
  return {
    async create(uid: string, fields: ProfileFields) {
      const clean = validateProfile(fields);
      const ref = doc(db, 'users', uid);
      // Retrying never overwrites an existing profile or resets an assistant role.
      await runTransaction(db, async (transaction) => {
        if ((await transaction.get(ref)).exists()) return;
        transaction.set(ref, {
          uid,
          ...clean,
          role: 'praktikan',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
    },
    async update(uid: string, fields: ProfileFields) {
      const clean = validateProfile(fields);
      const ref = doc(db, 'users', uid);
      // Transactions fail offline rather than leaving a queued write/spinner.
      await runTransaction(db, async (transaction) => {
        if (!(await transaction.get(ref)).exists())
          throw new Error('Profil tidak ditemukan. Muat ulang akun.');
        transaction.update(ref, { ...clean, updatedAt: serverTimestamp() });
      });
    },
  };
}
