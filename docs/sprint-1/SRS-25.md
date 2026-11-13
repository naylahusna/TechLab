# SRS-25 — Validasi Aksi

Branch: `feature/srs-25-validasi-aksi`.
Base PR: `feature/srs-22-state-bersama`.

## Peran terkait

- Asisten penanggung jawab: membuka atau menutup sesi yang ditugaskan.
- Praktikan: memenuhi syarat validasi saat melakukan presensi.
- Store: menolak aksi yang tidak memenuhi aturan.

## Owner

- Sprint 1: Arga Yura Danendra — validasi aksi dan transisi status (`0f7cc40`).
- Sprint 2: Tidak termasuk cakupan SRS-00–17 yang ditetapkan untuk Sprint 2.

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
