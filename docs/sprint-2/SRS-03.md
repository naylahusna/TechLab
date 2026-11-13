# SRS-03 — User Logout

**Sprint:** 2
**Owner:** Nayla Husna (Programmer 1 — Firebase Foundation & Authentication)  
**Peran terkait:** Pengguna yang sedang terautentikasi; Firebase Authentication.

## Tujuan

Mengakhiri sesi pengguna secara aman dan mengembalikan aplikasi ke alur autentikasi.

## Kebutuhan

- Pengguna dapat memulai logout dari area akun/profil.
- Logout mengakhiri sesi autentikasi melalui Firebase Authentication.
- Setelah logout, layar terlindungi tidak dapat diakses melalui navigasi kembali.
- Jika logout gagal, aplikasi menampilkan error dan tidak memberikan kesan bahwa sesi sudah berakhir.

## Kriteria penerimaan

1. Logout berhasil menghapus sesi aktif dan menampilkan halaman autentikasi.
2. Navigasi kembali setelah logout tidak membuka kembali konten terlindungi.
3. Kegagalan layanan ditampilkan secara eksplisit.

## Status

Dokumen ini mencatat kebutuhan Sprint 2; status implementasi harus diverifikasi terpisah.
