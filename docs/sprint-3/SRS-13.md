# SRS-13 — Schedule Change Push Notification

**Sprint:** 3
**Owner:** Arga Yura Danendra (Programmer 3 — Push Notification & Device Condition Handling)  
**Peran terkait:** Asisten yang mengubah jadwal praktikum; praktikan dan anggota kelas terkait; layanan push notification.

## Tujuan

Mengirimkan push notification kepada pengguna yang berkepentingan ketika jadwal praktikum mengalami perubahan agar peserta segera mengetahui pembaruan waktu, lokasi, atau pembatalan jadwal.

## Kebutuhan

- Sistem mendeteksi peristiwa ketika jadwal praktikum mengalami perubahan (perubahan waktu mulai/selesai, lokasi laboratorium, judul pertemuan, atau pengarsipan/pembatalan jadwal oleh asisten).
- Sistem menargetkan pengiriman push notification kepada pengguna yang berkepentingan pada kelas tersebut (praktikan terdaftar dan asisten terkait).
- Isi notifikasi memuat identitas kelas/praktikum dan ringkasan perubahan jadwal yang terjadi.
- Pengguna di luar kelas terkait tidak menerima notifikasi perubahan jadwal tersebut.

## Kriteria penerimaan

1. Pembaruan atau pembatalan jadwal praktikum oleh asisten memicu pengiriman push notification kepada anggota kelas terkait.
2. Pesan notifikasi memuat nama kelas/praktikum serta ringkasan jadwal terbaru.
3. Pengguna yang bukan anggota kelas tersebut tidak menerima notifikasi perubahan jadwal.
4. Penyimpanan perubahan jadwal di Cloud Firestore tetap berhasil meskipun pengiriman notifikasi mengalami kendala.

## Status

Dokumen ini mencatat kebutuhan Sprint 3; status implementasi harus diverifikasi terpisah.
