# SRS-02 — Dedicated Attendance Page

**Sprint:** 3
**Owner:** Muhammad Fahri (Programmer 1 — Laboratory Location & Location-Based Attendance)  
**Peran terkait:** Praktikan yang mengikuti sesi praktikum.

## Tujuan

Menyediakan halaman khusus untuk melakukan presensi yang terpisah dari halaman detail sesi agar praktikan dapat meninjau kesiapan sesi dan lokasi sebelum mencatat kehadiran.

## Kebutuhan

- Halaman presensi berada pada route/layar terpisah dari halaman detail sesi.
- Praktikan dapat mengakses halaman presensi dari halaman detail sesi yang diikutinya.
- Halaman presensi menampilkan informasi sesi yang akan diikuti (nama praktikum, kelas, pertemuan, nama laboratorium, waktu pelaksanaan) dan batas radius laboratorium.
- Halaman presensi menampilkan status sesi terkini (`scheduled`, `open`, `closed`, `cancelled`) serta status kehadiran pribadi praktikan.
- Halaman presensi menampilkan panel hasil pemeriksaan lokasi perangkat dan tombol pelaksanaan presensi (serta pintu pemindai QR sesi bila fitur tambahan `SRS-17` diaktifkan).

## Kriteria penerimaan

1. Praktikan melakukan presensi melalui halaman khusus presensi yang terpisah dari halaman detail sesi.
2. Informasi sesi, laboratorium, dan status sesi tampil konsisten dengan data di Cloud Firestore.
3. Aksi presensi hanya tersedia ketika sesi berstatus dibuka (`open`) dan praktikan belum tercatat hadir.
4. Navigasi bolak-balik antara detail sesi dan halaman presensi tidak menyebabkan duplikasi data atau error.

## Status

Dokumen ini mencatat kebutuhan Sprint 3; status implementasi harus diverifikasi terpisah.
