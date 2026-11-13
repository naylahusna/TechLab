import { isRole, type Role } from '../../core/roles';

export type ProfileFields = { name: string; number: string };
export type UserProfile = ProfileFields & { uid: string; role: Role };

export function validateProfile(fields: ProfileFields) {
  const name = fields.name.trim();
  const number = fields.number.trim();
  if (name.length < 2 || name.length > 100)
    throw new Error('Nama harus terdiri dari 2–100 karakter.');
  if (!/^[A-Za-z0-9.-]{1,32}$/.test(number))
    throw new Error('NIM/ID harus berisi 1–32 huruf, angka, titik, atau tanda hubung.');
  return { name, number };
}

export function validateCredentials(email: string, password: string, registering = false) {
  const normalized = email.trim().toLowerCase();
  if (normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized))
    throw new Error('Masukkan alamat email yang valid.');
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
  return { uid, role: data.role, ...validateProfile({ name: data.name, number: data.number }) };
}

export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Email atau password tidak sesuai.';
    case 'auth/email-already-in-use':
      return 'Email sudah terdaftar. Silakan login.';
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
