import type { Timestamp } from 'firebase/firestore';
import type { PracticumPermission, PracticumPermissionStatus } from '../practicum/types';

export type PermissionKind = 'sakit' | 'keluarga' | 'kegiatan-kampus' | 'lainnya';
export const permissionKinds: Record<PermissionKind, string> = {
  sakit: 'Sakit',
  keluarga: 'Keperluan keluarga',
  'kegiatan-kampus': 'Kegiatan kampus',
  lainnya: 'Lainnya',
};
export const permissionLabels: Record<PracticumPermissionStatus, string> = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
};
export type Permission = PracticumPermission &
  Readonly<{
    kind: PermissionKind;
    studentName: string;
    studentNumber: string;
    sessionTitle: string;
    className: string;
    sessionStartAt: Timestamp;
    decisionReason: string | null;
    aiConsent: boolean;
    aiSource: string | null;
    aiClassifiedAt: Timestamp | null;
    aiError: string | null;
  }>;
export type Classification = Readonly<{
  aiStatus: 'completed' | 'failed' | 'unavailable';
  aiCategory: string | null;
  aiConfidence: number | null;
  aiSource: string | null;
  aiError: string | null;
}>;
export function permissionId(sessionId: string, userId: string) {
  for (const id of [sessionId, userId]) {
    if (!id || id.includes('/') || id.length > 128)
      throw new Error('Identitas sesi/pengguna tidak valid.');
  }
  return `${sessionId}_${userId}`;
}
export function validateSubmission(reason: string, kind: string) {
  const clean = reason.trim();
  if (clean.length < 10 || clean.length > 2000)
    throw new Error('Alasan izin harus terdiri dari 10–2000 karakter.');
  if (!Object.hasOwn(permissionKinds, kind)) throw new Error('Pilih jenis izin yang tersedia.');
  return { reason: clean, kind: kind as PermissionKind };
}
export function validateDecision(status: string, reason: string) {
  if (status !== 'approved' && status !== 'rejected') throw new Error('Keputusan tidak valid.');
  const clean = reason.trim();
  if (clean.length > 1000) throw new Error('Catatan keputusan maksimal 1000 karakter.');
  if (status === 'rejected' && clean.length < 5)
    throw new Error('Tuliskan alasan penolakan minimal 5 karakter.');
  return { status, decisionReason: clean || null } as const;
}
export function filterPermissions(items: readonly Permission[], status: string, search: string) {
  const needle = search.trim().toLocaleLowerCase('id-ID');
  return items.filter(
    (item) =>
      (status === 'all' || item.status === status) &&
      (!needle ||
        `${item.studentName} ${item.studentNumber} ${item.sessionTitle} ${item.className}`
          .toLocaleLowerCase('id-ID')
          .includes(needle)),
  );
}
export function permissionError(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (code === 'permission-denied')
    return 'Akses izin ditolak. Periksa keanggotaan kelas dan rules Firebase bersama pengelola.';
  if (code === 'unavailable')
    return 'Koneksi terputus. Izin belum dikonfirmasi tersimpan; periksa koneksi dan coba lagi.';
  if (code === 'failed-precondition')
    return 'Data atau index Firebase belum siap. Coba lagi atau hubungi pengelola.';
  return error instanceof Error ? error.message : 'Tidak dapat memproses izin. Coba lagi.';
}
