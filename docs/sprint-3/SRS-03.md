# SRS-03 — Device Geolocation and Location Permission Handling

**Sprint:** 3
**Owner:** Muhammad Fahri (Programmer 1 — Laboratory Location & Location-Based Attendance)  
**Peran terkait:** Praktikan pada halaman presensi; layanan lokasi perangkat.

## Tujuan

Meminta izin akses lokasi perangkat dan membaca koordinat praktikan secara aman, serta menangani seluruh kondisi izin, layanan lokasi, dan koneksi jaringan pada halaman presensi.

## Kebutuhan

- Aplikasi meminta izin akses lokasi perangkat (*foreground location permission*) sesuai kebutuhan saat praktikan membuka halaman presensi.
- Aplikasi membaca koordinat perangkat terkini setelah izin diberikan dan layanan lokasi aktif.
- Aplikasi menangani secara eksplisit dan menampilkan informasi yang jelas untuk kondisi berikut:
  - Pengguna menolak izin akses lokasi.
  - Layanan lokasi/GPS perangkat tidak aktif.
  - Koordinat lokasi belum tersedia atau sedang dimuat.
  - Koneksi jaringan mengalami gangguan saat memuat data sesi atau laboratorium.
- Aplikasi menyediakan aksi untuk memeriksa ulang izin atau memperbarui pembacaan lokasi perangkat.

## Kriteria penerimaan

1. Aplikasi meminta izin akses lokasi secara eksplisit sebelum mengambil koordinat perangkat.
2. Jika izin lokasi ditolak atau GPS tidak aktif, halaman presensi menampilkan penjelasan penyebab yang jelas dan menonaktifkan pencatatan presensi.
3. Ketika koordinat belum tersedia atau sedang dimuat, halaman menampilkan status pemuatan dan tidak mengizinkan presensi sebelum koordinat terbaca.
4. Gangguan jaringan ditampilkan sebagai pesan error yang jelas tanpa menyebabkan aplikasi crash.

## Status

Dokumen ini mencatat kebutuhan Sprint 3; status implementasi harus diverifikasi terpisah.
