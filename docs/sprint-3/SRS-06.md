# SRS-06 — Interactive Laboratory Map Page

**Sprint:** 3
**Owner:** Nayla Husna (Programmer 2 — Interactive Laboratory Maps & Live Lab Activity)  
**Peran terkait:** Praktikan dan asisten yang membuka halaman Maps; layanan Maps React Native; Cloud Firestore.

## Tujuan

Menyediakan halaman Maps interaktif pada aplikasi yang menampilkan persebaran lokasi laboratorium di lingkungan Informatika berdasarkan data yang tersimpan di Cloud Firestore.

## Kebutuhan

- Aplikasi menyediakan halaman Maps khusus yang terintegrasi dengan navigasi aplikasi dari sprint sebelumnya.
- Halaman Maps menggunakan layanan peta React Native dan menampilkan fokus wilayah awal (*initial region/camera*) di area lingkungan laboratorium Informatika.
- Halaman memuat daftar lokasi laboratorium beserta koordinatnya dari koleksi laboratorium di Cloud Firestore (`SRS-01`).
- Halaman menyediakan status pemuatan (*loading*) dan tampilan kondisi kosong yang jelas apabila data laboratorium belum tersedia.

## Kriteria penerimaan

1. Praktikan dan asisten dapat membuka halaman Maps dari navigasi aplikasi tanpa error.
2. Peta menampilkan area lingkungan laboratorium Informatika dengan interaksi geser (*pan*) dan perbesar (*zoom*) yang responsif.
3. Data laboratorium pada halaman Maps bersumber dari Cloud Firestore dan konsisten antar pengguna.
4. Kondisi memuat atau data laboratorium kosong ditangani secara jelas tanpa menyebabkan crash.

## Status

Dokumen ini mencatat kebutuhan Sprint 3; status implementasi harus diverifikasi terpisah.
