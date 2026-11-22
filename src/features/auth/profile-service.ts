import { getFirebaseFirestore } from '../../services/firebase/firestore';
import { createProfileRepository } from './profile-repository';
import type { ProfileFields, RegistrationRole } from './model';

export async function createOwnProfile(uid: string, fields: ProfileFields, role: RegistrationRole) {
  await createProfileRepository(getFirebaseFirestore()).create(uid, fields, role);
}
export async function continueOwnAccountAsPractitioner(uid: string) {
  await createProfileRepository(getFirebaseFirestore()).continueAsPractitioner(uid);
}

export async function updateOwnProfile(uid: string, fields: ProfileFields) {
  await createProfileRepository(getFirebaseFirestore()).update(uid, fields);
}
