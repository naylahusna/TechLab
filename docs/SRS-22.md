# SRS-22 — State Bersama

Branch: `feature/srs-22-state-bersama`.
Base PR: `feature/srs-21-data-dummy`.

Satu snapshot menyimpan pengguna aktif, sesi, peserta, dan catatan kehadiran.
Provider dipasang sekali di root. `RoleProvider` dan `useRole()` lama adalah
alias ke provider/hook demo; semua screen lama tetap kompatibel.

`useDemo()` dan selector diekspor dari `src/core/index.ts`. Pergantian
pengguna mempertahankan referensi sesi/record, tidak membuat store per peran.
Data readonly dibekukan untuk mencegah perubahan langsung di UI.

Tahap ini menyediakan pembacaan data, pemilihan pengguna, serta reset demo.
Aksi sesi tervalidasi ditambahkan pada SRS-25, pencatatan presensi pada SRS-15.
Dengan demikian setiap branch tetap dapat dijalankan tanpa aksi setengah jadi.

Tes mencakup pergantian peran, isolasi snapshot per provider, reset, subscription,
kompatibilitas boolean, serta selector sesuai pengguna. Jalankan `npm test`,
`npx expo lint`, dan `npx tsc --noEmit`. Lihat `CORE-API.md` dan `SRS-PR-ORDER.md`.
