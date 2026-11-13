# SRS-12 — Real-Time Attendance Synchronization

**Sprint:** 2
**Owner:** Zaidan Ardiyansyah (Programmer 2 — Praktikum & Presensi)  
**Peran terkait:** Peserta dan asisten/pengelola sesi; Firebase data service.

## Tujuan

Menyinkronkan perubahan kehadiran agar pengguna yang berwenang melihat data terbaru tanpa memuat ulang secara manual.

## Kebutuhan

- Perubahan presensi yang berhasil dipersistensikan dipublikasikan ke tampilan yang berlangganan.
- Sinkronisasi menghormati aturan akses dan hanya mengirim data kepada pengguna berwenang.
- UI membedakan status memuat, data terbaru, dan error/koneksi terputus.
- Percobaan ulang tidak membuat catatan presensi ganda.
- Mekanisme subscription dibersihkan saat layar atau sesi tidak lagi digunakan.

## Kriteria penerimaan

1. Presensi yang berhasil muncul pada tampilan rekap yang berlangganan tanpa refresh manual.
2. Kehilangan koneksi/error ditampilkan dan tidak diperlakukan sebagai sinkronisasi sukses.
3. Pemulihan koneksi memperbarui data tanpa duplikasi.
4. Pengguna yang tidak berwenang tidak menerima data dari subscription.

## Status

Dokumen ini mencatat kebutuhan Sprint 2; status implementasi harus diverifikasi terpisah.
