# SRS-08 — Schedule Management

**Sprint:** 2
**Owner:** Zaidan Ardiyansyah (Programmer 2 — Praktikum & Presensi)  
**Peran terkait:** Pengelola jadwal yang berwenang; asisten dan peserta yang melihat jadwal.

## Tujuan

Mengelola dan menampilkan jadwal praktikum yang terkait kelas serta sesi.

## Kebutuhan

- Pengelola berwenang dapat membuat, melihat, memperbarui, dan membatalkan jadwal.
- Jadwal memuat kelas, praktikum, waktu mulai/selesai, lokasi, dan informasi lain yang diwajibkan.
- Waktu mulai harus lebih awal dari waktu selesai; data wajib harus valid.
- Perubahan jadwal disampaikan kepada pengguna yang relevan sesuai mekanisme notifikasi yang disepakati.
- Role pengelola jadwal ditetapkan pada matriks akses SRS-04.

## Kriteria penerimaan

1. Jadwal valid tersimpan dan tampil untuk pengguna yang terkait.
2. Jadwal invalid atau konflik yang dilarang kebijakan ditolak.
3. Pembatalan/perubahan tidak menghapus riwayat sesi yang sudah berjalan.
4. Pengguna tanpa izin tidak dapat mengubah jadwal.

## Status

Dokumen ini mencatat kebutuhan Sprint 2; status implementasi harus diverifikasi terpisah.
