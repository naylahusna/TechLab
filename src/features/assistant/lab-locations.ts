import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  getDoc,
  doc,
  deleteDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseFirestore } from '../../services/firebase/firestore';
import { getFirebaseAuth } from '../../services/firebase/auth';

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

const LAB_LOCATION_FIELDS = new Set([
  'name',
  'latitude',
  'longitude',
  'radiusMeters',
  'building',
  'floor',
  'plusCode',
  'pointType',
  'roomCenterVerified',
  'source',
  'caution',
  'createdAt',
  'updatedAt',
  'updatedBy',
]);

function hasExpectedLabLocationShape(data: Record<string, unknown>) {
  const keys = Object.keys(data);
  return keys.length === LAB_LOCATION_FIELDS.size
    && keys.every((key) => LAB_LOCATION_FIELDS.has(key))
    && typeof data.name === 'string'
    && typeof data.latitude === 'number'
    && data.latitude >= -90 && data.latitude <= 90
    && typeof data.longitude === 'number'
    && data.longitude >= -180 && data.longitude <= 180
    && typeof data.radiusMeters === 'number'
    && data.radiusMeters >= 1 && data.radiusMeters <= 5000
    && typeof data.building === 'string'
    && (data.floor == null || Number.isInteger(data.floor))
    && typeof data.plusCode === 'string'
    && data.pointType === 'building_map_reference'
    && data.roomCenterVerified === false
    && typeof data.source === 'string'
    && typeof data.caution === 'string'
    && data.createdAt != null
    && data.updatedAt != null
    && typeof data.updatedBy === 'string';
}

export function watchLabLocations(onData: (locations: LabLocation[]) => void, onError: (error: Error) => void): Unsubscribe {
  return onSnapshot(query(collection(getFirebaseFirestore(), 'labLocations'), orderBy('name')), (snapshot) => {
    onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as LabLocation));
  }, onError);
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
  if (id) {
    const ref = doc(db, 'labLocations', id);
    const existing = await getDoc(ref);
    if (!existing.exists() || !hasExpectedLabLocationShape(existing.data())) {
      throw new Error('Data lokasi lama tidak sesuai format. Hapus lalu tambahkan ulang melalui formulir.');
    }
    await setDoc(ref, { ...payload, createdAt: existing.data().createdAt });
  } else {
    await addDoc(collection(db, 'labLocations'), { ...payload, createdAt: serverTimestamp() });
  }
}

export async function removeLabLocation(id: string) {
  await deleteDoc(doc(getFirebaseFirestore(), 'labLocations', id));
}
