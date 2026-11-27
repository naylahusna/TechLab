import {
  collection,
  onSnapshot,
  orderBy,
  where,
  query,
  serverTimestamp,
  getDocsFromServer,
  runTransaction,
  updateDoc,
  type Timestamp,
  doc,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseFirestore } from '../../services/firebase/firestore';
import { labHasName, normalizeLabName, validateLabLocation, type LabLocationInput } from './lab-location-policy';
import { getFirebaseAuth } from '../../services/firebase/auth';

export type LabLocation = LabLocationInput & {
  id: string;
  archivedAt: Timestamp | null;
  previousNames: string[];
  pointType: string;
  roomCenterVerified: boolean;
  source: string;
  caution: string;
};

export const LOCATION_SOURCE = 'Google Maps business listing Plus Codes, converted to grid cell centers; UNDIP UTBK 2026 for lab floor';
export const LOCATION_CAUTION = 'Building-level map reference points only; NOT independently surveyed room coordinates and NOT adequate to distinguish nearby labs with GPS geofencing.';

function toLabLocation(id: string, data: Record<string, unknown>): LabLocation {
  return {
    ...(data as Omit<LabLocation, 'id'>),
    id,
    courseName: typeof data.courseName === 'string' ? data.courseName : '',
    graceMinutes: typeof data.graceMinutes === 'number' ? data.graceMinutes : 0,
    archivedAt: (data.archivedAt as Timestamp | undefined) ?? null,
    previousNames: Array.isArray(data.previousNames)
      ? data.previousNames.filter((name): name is string => typeof name === 'string') : [],
  };
}


export function watchAslabCourses(uid: string, onData: (courses: string[]) => void, onError: (error: Error) => void): Unsubscribe {
  return onSnapshot(doc(getFirebaseFirestore(), 'aslabScopes', uid), (snapshot) => {
    const courses: unknown = snapshot.data()?.courseNames;
    onData(Array.isArray(courses) ? courses.filter((value): value is string => typeof value === 'string') : []);
  }, onError);
}

export function watchScopedLabLocations(
  uid: string,
  onData: (locations: LabLocation[], fromCache: boolean) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  let stopLocations: Unsubscribe | undefined;
  const stopScope = watchAslabCourses(uid, (courses) => {
    stopLocations?.();
    onData([], true);
    if (courses.length === 0) {
      onData([], false);
      return;
    }
    stopLocations = onSnapshot(
      query(collection(getFirebaseFirestore(), 'labLocations'), where('courseName', 'in', courses)),
      { includeMetadataChanges: true },
      (snapshot) => onData(snapshot.docs
        .map((item) => toLabLocation(item.id, item.data()))
        .sort((left, right) => left.name.localeCompare(right.name)), snapshot.metadata.fromCache),
      onError,
    );
  }, (error) => {
    stopLocations?.();
    onData([], false);
    onError(error);
  });
  return () => {
    stopScope();
    stopLocations?.();
  };
}

export function watchLabLocations(onData: (locations: LabLocation[], fromCache: boolean) => void, onError: (error: Error) => void, includeMetadataChanges = false): Unsubscribe {
  return onSnapshot(query(collection(getFirebaseFirestore(), 'labLocations'), orderBy('name')), { includeMetadataChanges }, (snapshot) => {
    onData(snapshot.docs.map((item) => toLabLocation(item.id, item.data())), snapshot.metadata.fromCache);
  }, onError);
}

export async function saveLabLocation(input: LabLocationInput, id?: string): Promise<string> {
  const clean = validateLabLocation(input);
  const db = getFirebaseFirestore();
  const labs = collection(db, 'labLocations');
  const ref = id ? doc(labs, id) : doc(labs);
  const lock = doc(db, 'labCatalogRevisions', encodeURIComponent(clean.courseName));
  const uid = getFirebaseAuth().currentUser?.uid ?? '';
  await runTransaction(db, async (transaction) => {
    await transaction.get(lock);
    const existing = id ? await transaction.get(ref) : undefined;
    const current = existing?.data();
    if (id && (!current || current.courseName !== clean.courseName || current.archivedAt != null)) {
      throw new Error('Lab sudah diarsipkan atau berada di luar cakupan mata kuliah.');
    }

    // Read the current catalog after reading the revision. Concurrent saves
    // advance the revision and force Firestore to retry this check.
    const catalog = await getDocsFromServer(query(labs, where('courseName', '==', clean.courseName)));
    if (catalog.docs.some((item) => item.id !== ref.id && labHasName(toLabLocation(item.id, item.data()), clean.name))) {
      throw new Error('Nama lab sudah digunakan dalam mata kuliah ini.');
    }

    const previousNames = current ? toLabLocation(ref.id, current).previousNames.filter((name) =>
      normalizeLabName(name) !== normalizeLabName(clean.name)) : [];
    if (current && normalizeLabName(current.name) !== normalizeLabName(clean.name)
      && !previousNames.some((name) => normalizeLabName(name) === normalizeLabName(current.name))) {
      previousNames.push(current.name);
    }
    if (previousNames.length > 30) throw new Error('Lab ini sudah mencapai batas nama riwayat.');
    const payload = { ...clean, previousNames, updatedAt: serverTimestamp(), updatedBy: uid };

    if (current) {
      transaction.update(ref, payload);
    } else {
      transaction.set(ref, {
        ...payload, archivedAt: null, pointType: 'building_map_reference',
        roomCenterVerified: false, source: LOCATION_SOURCE, caution: LOCATION_CAUTION,
        createdAt: serverTimestamp(),
      });
    }
    transaction.set(lock, { courseName: clean.courseName, updatedAt: serverTimestamp() });
  });
  return ref.id;
}

export async function archiveLabLocation(id: string) {
  await updateDoc(doc(getFirebaseFirestore(), 'labLocations', id), {
    archivedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: getFirebaseAuth().currentUser?.uid ?? '',
  });
}
