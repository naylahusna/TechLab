# SRS-01 — User Registration

**Sprint:** 2
**Owner:** Nayla Husna (Programmer 1 — Firebase Foundation & Authentication)  
**Peran terkait:** Calon pengguna Praktikan atau Asisten; Firebase Authentication.

## Tujuan

Memungkinkan pengguna membuat akun dan menyimpan profil awal yang terhubung ke identitas autentikasi.

## Kebutuhan

- Form registrasi meminta informasi akun minimum yang disepakati, termasuk email dan kata sandi.
- Input wajib diperiksa sebelum dikirim; format email dan kebijakan kata sandi mengikuti konfigurasi autentikasi.
- Akun dibuat melalui Firebase Authentication. Profil aplikasi disimpan menggunakan identifier akun tersebut.
- Sistem menolak email yang sudah terdaftar dan menampilkan pesan yang sesuai.
- Kata sandi tidak disimpan sebagai field profil atau ditulis ke log.

## Kriteria penerimaan

1. Registrasi valid membuat akun dan profil yang terhubung dengan UID yang sama.
2. Input kosong atau format tidak valid ditolak sebelum akun dibuat.
3. Kegagalan Firebase ditampilkan sebagai kegagalan, bukan konfirmasi registrasi sukses.
4. Setelah registrasi berhasil, pengguna diarahkan ke alur autentikasi yang ditetapkan.

## Status

Dokumen ini mencatat kebutuhan Sprint 2; status implementasi harus diverifikasi terpisah.
