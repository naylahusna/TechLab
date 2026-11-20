import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  doc,
  deleteDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseFirestore } from '../../services/firebase/firestore';
import { getFirebaseAuth } from '../../services/firebase/auth';
import { useEmulators } from '../../services/firebase/app';

export type LabLocation = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  building: string;
  floor: number | null;
  plusCode: string;
  pointType: 'building_map_reference';
  roomCenterVerified: false;
  source: string;
  caution: string;
};

export const LOCATION_SOURCE = 'Google Maps business listing Plus Codes, converted to grid cell centers; UNDIP UTBK 2026 for lab floor';
export const LOCATION_CAUTION = 'Building-level map reference points only; NOT independently surveyed room coordinates and NOT adequate to distinguish nearby labs with GPS geofencing.';
export const INITIAL_LAB_LOCATIONS = [
  { id: 'lab-informatika-b', name: 'Lab Informatika B', building: 'Gedung E FSM UNDIP', floor: 2, latitude: -7.0482375, longitude: 110.440765625, plusCode: '6P4GXC2R+P82', radiusMeters: 30 },
  { id: 'lab-informatika-c', name: 'Lab Informatika C', building: 'Gedung E FSM UNDIP', floor: 2, latitude: -7.0482375, longitude: 110.440765625, plusCode: '6P4GXC2R+P82', radiusMeters: 30 },
  { id: 'lab-informatika-d', name: 'Lab Informatika D', building: 'Gedung E FSM UNDIP', floor: 2, latitude: -7.0482375, longitude: 110.440765625, plusCode: '6P4GXC2R+P82', radiusMeters: 30 },
  { id: 'dekanat-fsm', name: 'Dekanat FSM UNDIP', building: 'Gedung Dekanat FSM UNDIP', floor: null, latitude: -7.0490375, longitude: 110.441484375, plusCode: '6P4GXC2R+9HQ', radiusMeters: 50 },
];

export function watchLabLocations(onData: (locations: LabLocation[]) => void, onError: (error: Error) => void): Unsubscribe {
  return onSnapshot(query(collection(getFirebaseFirestore(), 'labLocations'), orderBy('name')), (snapshot) => {
    onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as LabLocation));
  }, onError);
}

export async function seedInitialLabLocations() {
  const db = getFirebaseFirestore();
  const existing = await getDocs(collection(db, 'labLocations'));
  if (!useEmulators && !existing.empty) return;
  const uid = getFirebaseAuth().currentUser?.uid ?? '';
  const locationsById = new Map(existing.docs.map((item) => [item.id, item]));
  const initialIds = new Set(INITIAL_LAB_LOCATIONS.map((item) => item.id));
  await Promise.all([
    ...existing.docs
      .filter((item) => !initialIds.has(item.id))
      .map((item) => deleteDoc(item.ref)),
    ...INITIAL_LAB_LOCATIONS.map(({ id, ...item }) => {
      const previous = locationsById.get(id);
      return setDoc(doc(db, 'labLocations', id), {
        ...item,
        pointType: 'building_map_reference',
        roomCenterVerified: false,
        source: LOCATION_SOURCE,
        caution: LOCATION_CAUTION,
        createdAt: previous?.data().createdAt ?? serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      });
    }),
  ]);
}

export async function saveLabLocation(input: Omit<LabLocation, 'id' | 'pointType' | 'roomCenterVerified' | 'source' | 'caution'>, id?: string) {
  const db = getFirebaseFirestore();
  const payload = {
    ...input,
    pointType: 'building_map_reference' as const,
    roomCenterVerified: false as const,
    source: LOCATION_SOURCE,
    caution: LOCATION_CAUTION,
    updatedAt: serverTimestamp(),
    updatedBy: getFirebaseAuth().currentUser?.uid ?? '',
  };
  if (id) await updateDoc(doc(db, 'labLocations', id), payload);
  else await addDoc(collection(db, 'labLocations'), { ...payload, createdAt: serverTimestamp() });
}

export async function removeLabLocation(id: string) {
  await deleteDoc(doc(getFirebaseFirestore(), 'labLocations', id));
}
