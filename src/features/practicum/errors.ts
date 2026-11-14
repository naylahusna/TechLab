import type { PracticumErrorCode } from './types';

export class PracticumError extends Error {
  readonly code: PracticumErrorCode;

  constructor(code: PracticumErrorCode, message: string) {
    super(message);
    this.name = 'PracticumError';
    this.code = code;
  }
}

/** Ubah error Firestore/validasi menjadi pesan yang aman ditampilkan. */
export function practicumErrorMessage(error: unknown): string {
  if (error instanceof PracticumError) return error.message;
  const code = (error as { code?: string })?.code;
  switch (code) {
    case 'permission-denied':
      return 'Kamu tidak memiliki akses untuk tindakan ini.';
    case 'unavailable':
      return 'Koneksi bermasalah. Periksa internet lalu coba lagi.';
    case 'not-found':
      return 'Data tidak ditemukan.';
    case 'already-exists':
      return 'Data sudah ada.';
    case 'failed-precondition':
      return 'Data berubah. Muat ulang lalu coba lagi.';
    default:
      return error instanceof Error ? error.message : 'Terjadi kesalahan. Coba lagi.';
  }
}
