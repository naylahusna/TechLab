# SRS-06 — Class Management

**Sprint:** 2
**Owner:** Zaidan Ardiyansyah (Programmer 2 — Praktikum & Presensi)  
**Peran terkait:** Pengelola kelas yang berwenang; pengguna yang melihat kelas.

## Tujuan

Menyediakan pengelolaan data kelas praktikum yang menjadi acuan peserta, jadwal, dan sesi.

## Kebutuhan

- Pengelola berwenang dapat membuat, melihat, memperbarui, dan menonaktifkan kelas.
- Data kelas memiliki identifier unik serta nama dan atribut kelas yang disepakati.
- Kelas yang telah dipakai oleh sesi atau peserta tidak dihapus secara destruktif tanpa kebijakan migrasi.
- Role yang berwenang mengelola kelas harus ditetapkan di matriks akses SRS-04.

## Kriteria penerimaan

1. Pengelola berwenang dapat membuat kelas dengan data wajib yang valid.
2. Data invalid atau identifier duplikat ditolak dengan pesan yang jelas.
3. Perubahan kelas tampil pada pembacaan berikutnya.
4. Pengguna tanpa izin tidak dapat mengubah data kelas.

## Status

Dokumen ini mencatat kebutuhan Sprint 2; status implementasi harus diverifikasi terpisah.
