# SRS-25 — Validasi Aksi

Branch: `feature/srs-25-validasi-aksi`.
Base PR: `feature/srs-22-state-bersama`.

Menambahkan aksi buka/tutup sesi dan validator bersama. Hanya asisten
penanggung jawab yang boleh menjalankan transisi upcoming → open → closed.
Status tidak bisa dilompati atau dikembalikan. Semua penolakan mempertahankan
referensi snapshot dan mengembalikan kode serta pesan untuk feedback UI.

Validator presensi memeriksa pengguna aktif, identitas, pendaftaran, status,
dan record yang sudah ada. Pencatatan record atomik dipasang pada SRS-15,
sehingga tahap ini tidak menyediakan jalur tulis presensi yang belum lengkap.

Tes memeriksa peran/penugasan, sesi hilang, urutan status, callback lama,
snapshot lintas peran, syarat presensi, reset, dan notifikasi subscriber.
`npm test`, `npx expo lint`, dan `npx tsc --noEmit` wajib lolos.
Kontrak ada di `CORE-API.md`, urutan PR di `SRS-PR-ORDER.md`.
