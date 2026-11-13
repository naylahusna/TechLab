# SRS-02 — User Login

**Sprint:** 2
**Owner:** Nayla Husna (Programmer 1 — Firebase Foundation & Authentication)  
**Peran terkait:** Pengguna terdaftar; Firebase Authentication.

## Tujuan

Mengautentikasi pengguna terdaftar dan membuka akses aplikasi sesuai status akun serta perannya.

## Kebutuhan

- Form login menerima kredensial yang diwajibkan oleh metode autentikasi.
- Kredensial diverifikasi melalui Firebase Authentication.
- Pesan kegagalan tidak membocorkan apakah akun tertentu terdaftar.
- Sesi autentikasi dipulihkan sesuai perilaku persistence yang disepakati.
- Pengguna tanpa profil/role yang valid tidak memperoleh akses ke area terlindungi.

## Kriteria penerimaan

1. Kredensial valid mengautentikasi pengguna dan memuat profil serta role yang sesuai.
2. Kredensial tidak valid menghasilkan pesan gagal dan tidak membuka halaman terlindungi.
3. Kegagalan jaringan atau layanan ditampilkan secara eksplisit.
4. Sesi yang dipulihkan tetap melewati pemeriksaan role dan status akun.

## Status

Dokumen ini mencatat kebutuhan Sprint 2; status implementasi harus diverifikasi terpisah.
