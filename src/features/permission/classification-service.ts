import { getFirebaseAuth } from '../../services/firebase/auth';
import type { UserProfile } from '../auth/model';
import { createPermissionClassifier, permissionAiConfigured } from './ai';
import { developmentServiceUrl } from '../../services/firebase/app';
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
  const classify = createPermissionClassifier({
    endpoint: developmentServiceUrl(process.env.EXPO_PUBLIC_PERMISSION_AI_URL),
  });
  const result = await classify(id, true, token);
  await repository.saveClassification(id, actor, result);
  return true;
}
