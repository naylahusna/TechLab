import { doc, runTransaction, serverTimestamp, type Firestore } from 'firebase/firestore';
import { directoryRoleFor, parseProfile, validateProfile, type ProfileFields } from './model';

export function createProfileRepository(db: Firestore) {
  return {
    async create(uid: string, fields: ProfileFields) {
      const clean = validateProfile(fields);
      const ref = doc(db, 'users', uid);
      // Retrying never overwrites an existing profile or resets an assistant role.
      await runTransaction(db, async (transaction) => {
        const existing = await transaction.get(ref);
        if (existing.exists()) {
          const data = parseProfile(uid, existing.data());
          transaction.set(doc(db, 'userDirectory', uid), {
            uid,
            name: data.name,
            number: data.number,
            role: directoryRoleFor(data),
            updatedAt: serverTimestamp(),
          });
          return;
        }
        transaction.set(ref, {
          uid,
          ...clean,
          role: 'praktikan',
          roles: ['praktikan'],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        transaction.set(doc(db, 'userDirectory', uid), {
          uid,
          ...clean,
          role: 'praktikan',
          updatedAt: serverTimestamp(),
        });
      });
    },
    async update(uid: string, fields: ProfileFields) {
      const clean = validateProfile(fields);
      const ref = doc(db, 'users', uid);
      // Transactions fail offline rather than leaving a queued write/spinner.
      await runTransaction(db, async (transaction) => {
        const profile = await transaction.get(ref);
        if (!profile.exists()) throw new Error('Profil tidak ditemukan. Muat ulang akun.');
        transaction.update(ref, { ...clean, updatedAt: serverTimestamp() });
        transaction.set(doc(db, 'userDirectory', uid), {
          uid,
          ...clean,
          role: directoryRoleFor(parseProfile(uid, profile.data())),
          updatedAt: serverTimestamp(),
        });
      });
    },
  };
}
