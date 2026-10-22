# TechLab

Aplikasi presensi praktikum berbasis **React Native dan Expo** untuk membantu praktikan dan asisten dalam kegiatan pencatatan kehadiran.

Repository ini digunakan bersama dari awal pengembangan sampai proyek selesai. 

## Ruang Lingkup Sprint 1

Sprint pertama berfokus pada mockup frontend interaktif dengan dua peran:

### Praktikan
- Melihat jadwal dan detail sesi.
- Melakukan presensi ketika sesi dibuka.
- Mendapatkan feedback keberhasilan presensi.
- Melihat riwayat kehadiran pribadi.

### Asisten
- Melihat jadwal dan detail sesi.
- Membuka dan menutup sesi praktikum.
- Melihat jumlah serta daftar peserta yang sudah dan belum hadir.
- Melihat waktu kehadiran praktikan.

## Batasan

- Seluruh identitas, jadwal, dan sesi menggunakan data dummy.
- Perubahan data dikelola menggunakan state selama aplikasi berjalan.
- Kedua peran menggunakan sumber state yang sama.
- Pergantian pengguna tidak menghapus perubahan data.
- Reload penuh mengembalikan data awal.
- Tidak menggunakan backend, API, database, atau sinkronisasi antarperangkat.
- Pengembangan dan build aplikasi menggunakan EAS, tanpa Expo Go.

## Teknologi

| Teknologi | Versi |
|---|---|
| React Native | 0.88.0 |
| Expo | ~58.0.17 |
| React | 19.3.0 |
| TypeScript | ~6.0.3 |

## Persiapan Proyek

Setelah melakukan clone repository, buka terminal pada folder yang berisi package.json:

```bash
npm ci
```

Gunakan npm dan package-lock.json yang tersedia agar dependency seluruh anggota konsisten.

## Pengembangan dengan EAS

Konfigurasi akun Expo, proyek EAS, dan build belum dilakukan pada fondasi awal ini.

Programmer yang menangani fondasi bertanggung jawab untuk:
1. Menyiapkan konfigurasi EAS pada akun yang disepakati tim.
2. Menyiapkan development build jika digunakan untuk pengembangan.
3. Menyiapkan build APK untuk demonstrasi.
4. Memperbarui bagian ini dengan langkah menjalankan yang sudah diuji.

Seluruh anggota menggunakan proyek EAS yang sama. Pergantian PM tidak memerlukan pembuatan proyek EAS baru.

## Pembagian Tugas

| Programmer | Tanggung Jawab | Kode SRS |
|---|---|---|
| Arga Yura Danendra | Fondasi aplikasi, pemilihan pengguna, navigasi, data dummy, shared state, dan validasi | SRS-01, SRS-02, SRS-03, SRS-04, SRS-15, SRS-21, SRS-22, SRS-25 |
| Muhammad Zaidaan Ardiyansyah | Jadwal, detail sesi, presensi, feedback, riwayat, dan kondisi kosong praktikan | SRS-05, SRS-07, SRS-12, SRS-13, SRS-14, SRS-16, SRS-20, SRS-23 |
| Muhammad Fahri | Jadwal, detail sesi, buka/tutup sesi, rekap, filter, dan kondisi kosong asisten | SRS-06, SRS-08, SRS-09, SRS-10, SRS-11, SRS-17, SRS-18, SRS-19, SRS-24 |

Arga menyediakan fondasi data dan fungsi bersama terlebih dahulu. Zaidaan dan Fahri menggunakan fondasi tersebut pada antarmuka masing-masing.

Struktur folder dan kontrak fungsi disepakati sebelum integrasi. Jangan membuat proyek Expo atau sumber data sesi terpisah untuk setiap programmer.

## Aturan Kolaborasi

- main digunakan untuk versi stabil yang telah diperiksa.
- develop digunakan untuk integrasi pekerjaan.
- Setiap programmer bekerja pada branch fitur masing-masing.
- Perubahan diajukan melalui pull request ke develop.
- Pull request mencantumkan kode SRS, ringkasan perubahan, hasil pengujian, dan kendala.
- PM minggu berjalan melakukan review dan merge bersama pemilik kode jika ada konflik.
- Setelah pengujian selesai, develop digabungkan ke main.

## Target Demonstrasi

1. Asisten membuka sesi.
2. Pengguna berganti menjadi praktikan.
3. Praktikan melakukan presensi satu kali.
4. Pengguna berganti menjadi asisten.
5. Asisten melihat rekap dan waktu kehadiran.
6. Asisten menutup sesi.
7. Praktikan tidak dapat melakukan presensi setelah sesi ditutup.

Informasi sesi dan kehadiran harus konsisten pada kedua peran.