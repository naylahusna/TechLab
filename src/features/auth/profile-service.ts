import { getFirebaseFirestore } from '../../services/firebase/firestore';
import { createProfileRepository } from './profile-repository';
import type { ProfileFields } from './model';

export async function createOwnProfile(uid: string, fields: ProfileFields) {
  await createProfileRepository(getFirebaseFirestore()).create(uid, fields);
}
export async function updateOwnProfile(uid: string, fields: ProfileFields) {
  await createProfileRepository(getFirebaseFirestore()).update(uid, fields);
}
