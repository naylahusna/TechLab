# SRS-01 — Laboratory Location and Radius Management

**Sprint:** 3
**Owner:** Muhammad Fahri (Programmer 1 — Laboratory Location & Location-Based Attendance)  
**Peran terkait:** Asisten sebagai pengelola lokasi laboratorium; praktikan dan fitur Maps sebagai pembaca data laboratorium.

## Tujuan

Menyediakan pengelolaan data lokasi, titik koordinat, dan radius presensi untuk setiap laboratorium praktikum di Cloud Firestore agar dapat digunakan sebagai acuan validasi presensi dan peta laboratorium.

## Kebutuhan

- Asisten yang berwenang dapat menentukan, melihat, dan memperbarui data lokasi laboratorium yang digunakan untuk kegiatan praktikum.
- Setiap laboratorium menyimpan identitas unik, nama laboratorium, koordinat (`latitude` dan `longitude`), serta batas radius presensi yang berlaku (dalam meter).
- Koordinat harus berada dalam rentang geografis yang valid (`latitude` -90 sampai 90, `longitude` -180 sampai 180) dan radius harus bernilai positif sesuai kebijakan.
- Informasi lokasi dan radius laboratorium disimpan menggunakan Cloud Firestore dan dapat dibaca oleh pengguna yang berkepentingan (halaman Presensi dan halaman Maps).
- Perubahan data lokasi dan radius laboratorium dilindungi oleh Firestore Security Rules sehingga hanya asisten berwenang yang dapat mengubahnya.

## Kriteria penerimaan

1. Asisten dapat menyimpan dan memperbarui lokasi, koordinat, dan radius presensi laboratorium yang valid di Cloud Firestore.
2. Input koordinat di luar rentang valid atau radius tidak valid (`<= 0`) ditolak dengan pesan yang jelas.
3. Praktikan tidak dapat mengubah atau menghapus data lokasi dan radius laboratorium.
4. Perubahan lokasi dan radius laboratorium langsung tersedia bagi modul Presensi (`SRS-02`–`05`) dan modul Maps (`SRS-06`–`10`).

## Status

Dokumen ini mencatat kebutuhan Sprint 3; status implementasi harus diverifikasi terpisah.
