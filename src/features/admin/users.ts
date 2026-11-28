import {
  collection, doc, getDocFromServer, getDocsFromServer, onSnapshot, query, runTransaction, serverTimestamp, where,
} from 'firebase/firestore';

import { parseProfile, type RejectionReason, type UserProfile } from '../auth/model';
import { getFirebaseFirestore } from '../../services/firebase/firestore';
import { getFirebaseAuth } from '../../services/firebase/auth';
import { developmentServiceUrl } from '../../services/firebase/app';
import { isLocalHost } from '../../services/firebase/development-host';
import { getPracticumRepository } from '../practicum/client';

const managedRoles = ['calon_asprak', 'asisten', 'asprak_ditolak', 'asprak_dicabut'];
type NextRole = 'asisten' | 'asprak_ditolak' | 'asprak_dicabut';
export type RoleChange = { user: UserProfile; nextRole: NextRole; rejectionReason?: RejectionReason; classId?: string; classLabel?: string };

export function watchUsers(onData: (users: UserProfile[], fromCache: boolean) => void, onError: (error: Error) => void) {
  const directory = query(collection(getFirebaseFirestore(), 'userDirectory'), where('role', 'in', managedRoles));
  return onSnapshot(directory, { includeMetadataChanges: true }, (snapshot) => {
    try {
      const users = snapshot.docs.map((entry) => parseProfile(entry.id, entry.data()));
      users.sort((a, b) => a.name.localeCompare(b.name, 'id'));
      onData(users, snapshot.metadata.fromCache);
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Direktori pengguna tidak valid.'));
    }
  }, onError);
}

export async function listAssignmentClasses(user: UserProfile, nextRole: 'asisten' | 'asprak_dicabut') {
  const actor = getFirebaseAuth().currentUser;
  if (!actor) throw new Error('Silakan masuk kembali.');
  const db = getFirebaseFirestore();
  const scope = (await getDocFromServer(doc(db, 'aslabScopes', actor.uid))).data();
  const courses = scope?.courseNames;
  if (!Array.isArray(courses) || courses.length === 0) return [];
  const classes = await getPracticumRepository().listClassesForAslab(courses);
  return nextRole === 'asisten' ? classes : classes.filter((item) => item.assistantIds.includes(user.uid));
}

async function sendAssignment(uid: string, action: 'approve' | 'revoke' | 'assign', classId?: string) {
  if (!classId) throw new Error('Pilih penugasan kelas terlebih dahulu.');
  const account = getFirebaseAuth().currentUser;
  if (!account) throw new Error('Silakan masuk kembali.');
  const configured = developmentServiceUrl(process.env.EXPO_PUBLIC_ATTENDANCE_API_URL || (__DEV__ ? 'http://127.0.0.1:8788' : undefined));
  if (!configured) throw new Error('Server penugasan belum dikonfigurasi. Hubungi pengelola.');
  const url = new URL('/api/asprak-assignments', configured);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && __DEV__ && isLocalHost(url.hostname))) {
    throw new Error('Alamat server penugasan harus menggunakan HTTPS.');
  }
  if (url.username || url.password) throw new Error('Alamat server penugasan tidak valid.');

  const token = await account.getIdToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url.toString(), {
      method: 'POST', signal: controller.signal, redirect: 'error',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, uid, classId }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(typeof data?.message === 'string' ? data.message : 'Penugasan gagal diproses.');
    if (data?.role !== 'asisten' && data?.role !== 'asprak_dicabut') {
      throw new Error('Respons penugasan tidak valid. Muat ulang daftar pengguna.');
    }
    return data.role as 'asisten' | 'asprak_dicabut';
  } finally {
    clearTimeout(timeout);
  }
}

export async function resolveActiveAsprakByNumber(number: string) {
  const directory = collection(getFirebaseFirestore(), 'userDirectory');
  const matches = await getDocsFromServer(query(directory, where('number', '==', number), where('role', '==', 'asisten')));
  if (matches.size > 1) throw new Error('NIM cocok dengan beberapa akun Asprak.');
  if (matches.empty) {
    const known = await getDocsFromServer(query(directory, where('number', '==', number)));
    throw new Error(known.empty ? 'NIM tidak ditemukan.' : 'Akun Asprak aktif tidak ditemukan. Periksa status pengajuan.');
  }
  return parseProfile(matches.docs[0].id, matches.docs[0].data());
}

export function assignActiveAsprak(uid: string, classId: string) {
  return sendAssignment(uid, 'assign', classId);
}

export async function changeUserRole({ user, nextRole, rejectionReason, classId }: RoleChange) {
  if (nextRole === 'asisten' || nextRole === 'asprak_dicabut') {
    return sendAssignment(user.uid, nextRole === 'asisten' ? 'approve' : 'revoke', classId);
  }
  const db = getFirebaseFirestore();
  const profile = doc(db, 'users', user.uid);
  const directory = doc(db, 'userDirectory', user.uid);
  if (rejectionReason === 'no_practitioner_account') {
    const candidates = await getDocsFromServer(query(
      collection(db, 'userDirectory'),
      where('role', '==', 'praktikan'),
      where('number', '==', user.number),
    ));
    const matches = candidates.docs.filter((entry) => entry.data().name === user.name);
    if (matches.length > 0) {
      throw new Error('Akun Praktikan yang cocok sudah ada. Pilih alasan penolakan lain jika diperlukan.');
    }
  }

  await runTransaction(db, async (transaction) => {
    const current = (await transaction.get(directory)).data();
    if (!current || current.role !== user.role || current.name !== user.name || current.number !== user.number || current.rejectionReason !== user.rejectionReason) {
      throw new Error('Data akun sudah berubah. Periksa daftar terbaru.');
    }
    const changes = { role: nextRole, updatedAt: serverTimestamp(), ...(rejectionReason ? { rejectionReason } : {}) };
    transaction.update(profile, changes);
    transaction.update(directory, changes);
  });
  return nextRole;
}
