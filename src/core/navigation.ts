import type { Role } from './roles';

/** Public routes stay shared; their labels and content follow the active role. */
export const navigationFor = (role: Role) => ({
  jadwal: {
    label: role === 'praktikan' ? 'Jadwal' : 'Sesi Saya',
    title: role === 'praktikan' ? 'Jadwal praktikum' : 'Sesi yang ditangani',
    subtitle: role === 'praktikan' ? 'Ruang untuk aktivitas praktikum yang kamu ikuti.' : 'Ruang untuk sesi praktikum yang kamu dampingi.',
    emptyTitle: 'Jadwal akan tampil di sini',
    emptyDescription: role === 'praktikan' ? 'Informasi pelaksanaan dan detail sesi praktikum akan tersedia di halaman ini.' : 'Informasi sesi dan pengelolaan pelaksanaan praktikum akan tersedia di halaman ini.',
  },
  catatan: {
    label: role === 'praktikan' ? 'Riwayat' : 'Rekap',
    title: role === 'praktikan' ? 'Riwayat kehadiran' : 'Rekap kehadiran',
    subtitle: role === 'praktikan' ? 'Ruang untuk catatan kehadiran pribadimu.' : 'Ruang untuk memantau kehadiran peserta praktikum.',
    emptyTitle: role === 'praktikan' ? 'Belum ada catatan kehadiran' : 'Belum ada rekap peserta',
    emptyDescription: role === 'praktikan' ? 'Catatan kehadiranmu akan tampil di sini setelah presensi dicatat.' : 'Ringkasan dan daftar kehadiran peserta akan tampil di sini setelah sesi tersedia.',
  },
  profil: { label: 'Profil', title: 'Profil pengguna' },
});
