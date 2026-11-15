import { getFirebaseAuth } from '../../services/firebase/auth';
import type { UserProfile } from '../auth/model';
import { classifyPermission, permissionAiConfigured } from './ai';
import { getPermissionRepository } from './hooks';

export async function classifySavedPermission(id: string, actor: UserProfile) {
  if (!permissionAiConfigured) throw new Error('Perantara AI belum dikonfigurasi.');
  const user = getFirebaseAuth().currentUser;
  if (!user || user.uid !== actor.uid || actor.role !== 'praktikan')
    throw new Error('Masuk sebagai pemohon untuk mencoba analisis AI.');
  const token = await user.getIdToken();
  const repository = getPermissionRepository();
  const started = await repository.beginClassification(id, actor);
  if (!started) return false;
  const result = await classifyPermission(id, true, token);
  await repository.saveClassification(id, actor, result);
  return true;
}
