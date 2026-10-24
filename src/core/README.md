# Core

Folder ini adalah sumber tunggal state demo dan aturan bisnis aplikasi.

Rencana file:

- `types.ts` — tipe `User`, `Role`, `Session`, `AttendanceRecord`, dan status.
- `demo-data.ts` — seluruh data dummy awal.
- `demo-store.tsx` — provider/context dan aksi state bersama.
- `rules.ts` — validasi transisi sesi dan presensi.

Hanya Arga yang menjadi owner utama folder ini. Programmer lain menggunakan API
yang tersedia, bukan membuat state paralel.
