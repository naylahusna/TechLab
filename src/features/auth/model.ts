import { isRole, type Role } from '../../core/roles';

export type RegistrationRole = 'praktikan' | 'calon_asprak';

export type ProfileFields = { name: string; number: string };
export type RejectionReason = 'no_practitioner_account' | 'other';
export type UserProfile = ProfileFields & { uid: string; role: Role; rejectionReason?: RejectionReason; reapplied?: boolean };

export const rejectionReasonLabels: Record<RejectionReason, string> = {
  no_practitioner_account: 'Belum ada akun Praktikan dengan nama dan NIM yang cocok.',
  other: 'Pengajuan belum memenuhi syarat. Hubungi Aslab untuk mengetahui detailnya.',
};

export function validateProfile(fields: ProfileFields) {
  const name = fields.name.trim();
  const number = fields.number.trim();
  if (name.length < 2 || name.length > 100)
    throw new Error('Nama harus terdiri dari 2–100 karakter.');
  if (!/^[A-Za-z0-9.-]{1,32}$/.test(number))
    throw new Error('NIM/ID harus berisi 1–32 huruf, angka, titik, atau tanda hubung.');
  return { name, number };
}

export function normalizeLoginEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized))
    throw new Error('Masukkan alamat email yang valid.');
  return normalized;
}

export function validateCredentials(email: string, password: string, registering = false) {
  const normalized = normalizeLoginEmail(email);
  if (!password || (registering && password.length < 6))
    throw new Error('Password harus terdiri dari minimal 6 karakter.');
  return normalized;
}

export function parseProfile(uid: string, data: Record<string, unknown>): UserProfile {
  if (
    data.uid !== uid ||
    !isRole(data.role) ||
    typeof data.name !== 'string' ||
    typeof data.number !== 'string'
  ) {
    throw new Error('Profil akun tidak valid. Hubungi pengelola TechLab.');
  }
  const rejectionReason = data.role === 'asprak_ditolak' &&
    (data.rejectionReason === 'no_practitioner_account' || data.rejectionReason === 'other')
      ? data.rejectionReason : undefined;
  return {
    uid, role: data.role, ...validateProfile({ name: data.name, number: data.number }),
    ...(rejectionReason ? { rejectionReason } : {}),
    ...(data.reappliedAt != null ? { reapplied: true } : {}),
  };
}

export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Email atau password tidak sesuai.';
    case 'auth/email-already-in-use':
      return 'Email sudah terdaftar. Masuk dengan email ini untuk melihat status akun atau melanjutkan pendaftaran yang tersedia.';
    case 'auth/invalid-email':
      return 'Alamat email tidak valid.';
    case 'auth/weak-password':
      return 'Password belum memenuhi ketentuan Firebase.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan. Coba lagi nanti.';
    case 'auth/network-request-failed':
    case 'unavailable':
    case 'deadline-exceeded':
      return 'Koneksi bermasalah. Periksa internet dan coba lagi.';
    case 'permission-denied':
      return 'Akses data ditolak. Hubungi pengelola TechLab.';
    case 'auth/user-disabled':
      return 'Akun dinonaktifkan. Hubungi pengelola TechLab.';
    case 'auth/operation-not-allowed':
      return 'Login email/password belum diaktifkan di Firebase.';
    default:
      return !code && error instanceof Error
        ? error.message
        : 'Layanan belum dapat memproses permintaan. Coba lagi.';
  }
}
