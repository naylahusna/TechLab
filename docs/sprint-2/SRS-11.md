# SRS-11 — Attendance Recapitulation

**Sprint:** 2
**Owner:** Zaidan Ardiyansyah (Programmer 2 — Praktikum & Presensi)  
**Peran terkait:** Asisten/pengelola yang berwenang melihat rekap.

## Tujuan

Menyajikan ringkasan dan daftar kehadiran untuk sesi atau kelas yang dapat diakses pengguna.

## Kebutuhan

- Rekap menampilkan jumlah peserta, hadir, dan belum hadir.
- Daftar menampilkan identitas peserta yang diizinkan, status kehadiran, dan waktu hadir bila tersedia.
- Filter rekap tidak mengubah catatan sumber.
- Akses rekap dibatasi pada sesi/kelas yang menjadi kewenangan pengguna.
- Perhitungan total harus konsisten dengan daftar peserta yang menjadi dasar rekap.

## Kriteria penerimaan

1. Jumlah hadir dan belum hadir sesuai catatan serta roster terbaru.
2. Filter menghasilkan daftar yang sesuai tanpa menulis perubahan data.
3. Sesi yang ditutup tetap memiliki rekap historis.
4. Pengguna tanpa kewenangan tidak dapat membuka rekap terlindungi.

## Status

Dokumen ini mencatat kebutuhan Sprint 2; status implementasi harus diverifikasi terpisah.
