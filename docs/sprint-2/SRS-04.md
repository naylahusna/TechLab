# SRS-04 — Role-Based Access Control

**Sprint:** 2
**Owner:** Nayla Husna (Programmer 1 — Firebase Foundation & Authentication)  
**Peran terkait:** Pengguna terautentikasi; role yang diizinkan; sistem otorisasi.

## Tujuan

Membatasi layar dan operasi berdasarkan role yang diberikan kepada akun.

## Kebutuhan

- Role akun berasal dari profil/sumber tepercaya, bukan nilai bebas dari form klien.
- Setiap layar dan operasi terlindungi memeriksa autentikasi serta role yang diperlukan.
- Pengguna tanpa role atau dengan role tidak valid ditolak dan diarahkan ke alur penanganan yang sesuai.
- Aturan akses server/Firebase menerapkan pembatasan yang setara untuk data terlindungi; menyembunyikan UI saja tidak cukup.
- Daftar role, matriks izin, dan prosedur pemberian role ditetapkan tim sebelum rilis.

## Kriteria penerimaan

1. Pengguna hanya dapat melihat dan menjalankan fungsi yang diizinkan untuk role-nya.
2. Mengubah nilai role di klien tidak memberikan akses tambahan.
3. Akses langsung ke route atau data tanpa izin ditolak.
4. Role yang belum ditetapkan menghasilkan akses tertolak, bukan akses bawaan.

## Status

Dokumen ini mencatat kebutuhan Sprint 2; status implementasi harus diverifikasi terpisah.
