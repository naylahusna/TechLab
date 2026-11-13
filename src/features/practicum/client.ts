import { getFirebaseFirestore } from '../../services/firebase/firestore';
import { createPracticumRepository, type PracticumRepository } from './repository';

let repository: PracticumRepository | undefined;

/** Satu instance repository untuk seluruh layar praktikum. */
export function getPracticumRepository(): PracticumRepository {
  if (!repository) repository = createPracticumRepository(getFirebaseFirestore());
  return repository;
}
