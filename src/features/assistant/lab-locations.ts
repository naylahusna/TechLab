import {
  collection, doc, getDocsFromServer, onSnapshot, orderBy, query, runTransaction,
  serverTimestamp, where, type Timestamp, type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseFirestore } from '../../services/firebase/firestore';
import { getFirebaseAuth } from '../../services/firebase/auth';
import { courseLabKey, labHasName, normalizeLabName, validateGraceMinutes, validateLabLocation, type LabLocationInput } from './lab-location-policy';

export type LabLocation = LabLocationInput & {
  id: string;
  catalogVersion?: number;
  archivedAt: Timestamp | null;
  previousNames: string[];
  legacyCourseName: string;
  legacyGraceMinutes: number | null;
  pointType: string;
  roomCenterVerified: boolean;
  source: string;
  caution: string;
};

export type CourseLabSettings = {
  courseName: string;
  labIds: string[];
  formerLabIds: string[];
  graceMinutes: number | null;
};

export const LOCATION_SOURCE = 'Google Maps business listing Plus Codes, converted to grid cell centers; UNDIP UTBK 2026 for lab floor';
export const LOCATION_CAUTION = 'Building-level map reference points only; NOT independently surveyed room coordinates and NOT adequate to distinguish nearby labs with GPS geofencing.';

function toLabLocation(id: string, data: Record<string, unknown>): LabLocation {
  return {
    ...(data as Omit<LabLocation, 'id'>),
    id,
    legacyCourseName: typeof data.courseName === 'string' ? data.courseName : '',
    legacyGraceMinutes: typeof data.graceMinutes === 'number' && Number.isSafeInteger(data.graceMinutes)
      && data.graceMinutes >= 0 ? data.graceMinutes : null,
    archivedAt: (data.archivedAt as Timestamp | undefined) ?? null,
    previousNames: Array.isArray(data.previousNames)
      ? data.previousNames.filter((name): name is string => typeof name === 'string') : [],
  };
}

function toSettings(data: Record<string, unknown>): CourseLabSettings {
  return {
    courseName: String(data.courseName),
    labIds: Array.isArray(data.labIds) ? data.labIds.filter((id): id is string => typeof id === 'string') : [],
    formerLabIds: Array.isArray(data.formerLabIds) ? data.formerLabIds.filter((id): id is string => typeof id === 'string') : [],
    graceMinutes: typeof data.graceMinutes === 'number' ? data.graceMinutes : null,
  };
}

function initialSettings(courseName: string, labs: LabLocation[]): CourseLabSettings {
  const previous = labs.filter((lab) => lab.legacyCourseName === courseName);
  const values = [...new Set(previous.map((lab) => lab.legacyGraceMinutes).filter((value) => value !== null))];
  return { courseName, labIds: previous.map((lab) => lab.id), formerLabIds: [], graceMinutes: values.length === 1 ? values[0] : null };
}

export function watchAslabCourses(uid: string, onData: (courses: string[]) => void, onError: (error: Error) => void): Unsubscribe {
  return onSnapshot(doc(getFirebaseFirestore(), 'aslabScopes', uid), (snapshot) => {
    const courses: unknown = snapshot.data()?.courseNames;
    onData(Array.isArray(courses) ? courses.filter((value): value is string => typeof value === 'string') : []);
  }, onError);
}

export function watchCourseLabSettings(
  courseName: string, onData: (settings: CourseLabSettings | null) => void, onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(doc(getFirebaseFirestore(), 'courseLabSettings', courseLabKey(courseName)),
    (snapshot) => onData(snapshot.exists() ? toSettings(snapshot.data()) : null), onError);
}

export function watchLabManagers(onData: (managers: Record<string, string>) => void, onError: (error: Error) => void): Unsubscribe {
  return onSnapshot(collection(getFirebaseFirestore(), 'labManagers'), (snapshot) => {
    onData(Object.fromEntries(snapshot.docs.map((item) => [item.id, String(item.data().courseName)])));
  }, onError);
}

export function watchLabLocations(onData: (locations: LabLocation[], fromCache: boolean) => void, onError: (error: Error) => void, includeMetadataChanges = false): Unsubscribe {
  return onSnapshot(query(collection(getFirebaseFirestore(), 'labLocations'), orderBy('name')), { includeMetadataChanges }, (snapshot) => {
    onData(snapshot.docs.map((item) => toLabLocation(item.id, item.data())), snapshot.metadata.fromCache);
  }, onError);
}

export async function saveCourseLabSettings(
  courseName: string,
  change: { graceMinutes: number } | { labId: string; linked: boolean },
) {
  const db = getFirebaseFirestore();
  const labs = collection(db, 'labLocations');
  const ref = doc(db, 'courseLabSettings', courseLabKey(courseName));
  const lock = doc(db, 'labCatalogRevisions', 'catalog');
  await runTransaction(db, async (transaction) => {
    await transaction.get(lock);
    const snapshot = await transaction.get(ref);
    const legacy = snapshot.exists() ? [] : (await getDocsFromServer(query(labs, where('courseName', '==', courseName))))
      .docs.map((item) => toLabLocation(item.id, item.data()));
    const settings = snapshot.exists() ? toSettings(snapshot.data()) : initialSettings(courseName, legacy);
    if ('graceMinutes' in change) {
      settings.graceMinutes = validateGraceMinutes(change.graceMinutes);
    } else if (change.linked) {
      const lab = await transaction.get(doc(labs, change.labId));
      if (!lab.exists() || lab.data().archivedAt != null) throw new Error('Pilih lab yang masih aktif.');
      settings.labIds = [...new Set([...settings.labIds, change.labId])];
    } else if (settings.labIds.includes(change.labId)) {
      settings.labIds = settings.labIds.filter((id) => id !== change.labId);
      settings.formerLabIds = [...new Set([...settings.formerLabIds, change.labId])];
    }
    transaction.set(ref, { ...settings, updatedAt: serverTimestamp() });
    transaction.set(lock, { updatedAt: serverTimestamp() });
  });
}

export async function saveLabLocation(input: LabLocationInput, courseName: string, id?: string): Promise<string> {
  const clean = validateLabLocation(input);
  const db = getFirebaseFirestore();
  const labs = collection(db, 'labLocations');
  const ref = id ? doc(labs, id) : doc(labs);
  const lock = doc(db, 'labCatalogRevisions', 'catalog');
  const settingsRef = doc(db, 'courseLabSettings', courseLabKey(courseName));
  const uid = getFirebaseAuth().currentUser?.uid ?? '';

  await runTransaction(db, async (transaction) => {
    await transaction.get(lock);
    const current = id ? (await transaction.get(ref)).data() : undefined;
    if (id && (!current || current.archivedAt != null)) throw new Error('Lab tidak tersedia atau sudah diarsipkan.');
    const savedSettings = !id ? await transaction.get(settingsRef) : undefined;
    // The shared revision makes concurrent saves retry their name check.
    const catalog = (await getDocsFromServer(labs)).docs.map((item) => toLabLocation(item.id, item.data()));
    if (catalog.some((item) => item.id !== ref.id && labHasName(item, clean.name))) {
      throw new Error('Nama lab sudah digunakan. Tautkan lab yang sudah ada ke mata kuliah.');
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
      const settings = savedSettings?.exists() ? toSettings(savedSettings.data()) : initialSettings(courseName, catalog);
      transaction.set(ref, {
        ...payload, catalogVersion: 2, archivedAt: null, pointType: 'building_map_reference', roomCenterVerified: false,
        source: LOCATION_SOURCE, caution: LOCATION_CAUTION, createdAt: serverTimestamp(),
      });
      transaction.set(doc(db, 'labManagers', ref.id), { courseName });
      transaction.set(settingsRef, {
        ...settings, labIds: [...new Set([...settings.labIds, ref.id])], updatedAt: serverTimestamp(),
      });
    }
    transaction.set(lock, { updatedAt: serverTimestamp() });
  });
  return ref.id;
}

export async function listLabCourses(lab: LabLocation): Promise<string[]> {
  const db = getFirebaseFirestore();
  const settings = collection(db, 'courseLabSettings');
  const links = await Promise.all(['labIds', 'formerLabIds'].map((field) =>
    getDocsFromServer(query(settings, where(field, 'array-contains', lab.id))),
  ));
  const courses = [...new Set(links.flatMap((result) => result.docs.map((item) => toSettings(item.data()).courseName)))];
  if (lab.legacyCourseName && !courses.includes(lab.legacyCourseName)) {
    // Preserved legacy schedules may still refer to this lab by name.
    courses.push(lab.legacyCourseName);
  }
  return courses;
}

export async function archiveLabLocation(id: string) {
  const db = getFirebaseFirestore();
  const uid = getFirebaseAuth().currentUser?.uid;
  if (!uid) throw new Error('Masuk sebagai Aslab untuk mengarsipkan lab.');
  const ref = doc(db, 'labLocations', id);
  const lock = doc(db, 'labCatalogRevisions', 'catalog');
  await runTransaction(db, async (transaction) => {
    await transaction.get(lock);
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('Lab tidak ditemukan.');
    if (snapshot.data().archivedAt != null) return;
    const scope = await transaction.get(doc(db, 'aslabScopes', uid));
    const courses = await listLabCourses(toLabLocation(id, snapshot.data()));
    if (courses.some((course) => !scope.data()?.courseNames?.includes(course))) {
      throw new Error('Lab masih dipakai mata kuliah di luar cakupanmu.');
    }
    transaction.update(ref, { archivedAt: serverTimestamp(), updatedAt: serverTimestamp(), updatedBy: uid });
    transaction.set(lock, { updatedAt: serverTimestamp() });
  });
}
