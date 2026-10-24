# Core

Folder ini adalah sumber tunggal state demo dan aturan bisnis aplikasi.

Sudah tersedia pada SRS-02–04:

- `users.ts`: tujuh identitas dummy bersama.
- `identity-state.ts`: perubahan role/user secara atomik dan validasi pilihan.
- `role-context.tsx`: provider root dan hook `useRole()`; tidak dipasang ulang
  saat berganti halaman/pengguna.
- `navigation.ts`: penamaan menu dan isi pengantar sesuai role.

API saat ini: `users`, `currentRole`, `currentUserId`, `currentUser`, dan
`selectUser(userId, role)`. Jangan membuat state identitas kedua.

SRS-21 menambahkan `types.ts` dan `demo-data.ts` untuk kontrak readonly dan
factory snapshot awal. Integrasi ke provider dilakukan pada SRS-22.

Rencana file untuk SRS berikutnya (belum diimplementasikan):

- `demo-store.tsx` — provider/context dan aksi state bersama.
- `rules.ts` — validasi transisi sesi dan presensi.

Hanya Arga yang menjadi owner utama folder ini. Programmer lain menggunakan API
yang tersedia, bukan membuat state paralel.
