import type { Role } from './roles';

/** Public routes stay shared; their labels and content follow the active role. */
export const navigationFor = (role: Role) => ({
  jadwal: {
    label: role === 'praktikan' ? 'Jadwal' : 'Sesi Saya',
    title: role === 'praktikan' ? 'Jadwal praktikum' : 'Sesi yang ditangani',
    subtitle:
      role === 'praktikan'
        ? 'Ruang untuk aktivitas praktikum yang kamu ikuti.'
        : 'Ruang untuk sesi praktikum yang kamu dampingi.',
    emptyTitle:
      role === 'praktikan' ? 'Jadwal akan tampil di sini' : 'Belum ada sesi yang ditugaskan',
    emptyDescription:
      role === 'praktikan'
        ? 'Informasi pelaksanaan dan detail sesi praktikum akan tersedia di halaman ini.'
        : 'Saat ini belum ada jadwal praktikum yang ditugaskan kepadamu. Sesi akan muncul di sini setelah jadwal tersedia.',
  },
  catatan: {
    label: role === 'praktikan' ? 'Riwayat' : 'Rekap',
    title: role === 'praktikan' ? 'Riwayat kehadiran' : 'Rekap kehadiran',
    subtitle:
      role === 'praktikan'
        ? 'Ruang untuk catatan kehadiran pribadimu.'
        : 'Ruang untuk memantau kehadiran peserta praktikum.',
    emptyTitle: role === 'praktikan' ? 'Belum ada catatan kehadiran' : 'Rekap peserta masih kosong',
    emptyDescription:
      role === 'praktikan'
        ? 'Catatan kehadiranmu akan tampil di sini setelah presensi dicatat.'
        : 'Belum ada data presensi untuk direkap. Ringkasan dan status peserta akan tampil setelah presensi tercatat pada sesi praktikum.',
  },
  profil: { label: 'Profil', title: 'Profil pengguna' },
});
