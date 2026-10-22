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

## Software Requirements Specification

SRS berikut menjadi acuan pengembangan Sprint 1. Seluruh kebutuhan menggunakan data dummy dan state lokal, tanpa backend atau sinkronisasi antarperangkat.

| Kode SRS | Kebutuhan | Deskripsi dan Hasil yang Diharapkan |
|---|---|---|
| SRS-01 | Pemilihan peran | Pengguna dapat memilih peran Praktikan atau Asisten untuk mengakses tampilan yang sesuai. |
| SRS-02 | Pemilihan identitas | Pengguna dapat memilih identitas dummy sesuai peran. Tombol masuk hanya aktif setelah identitas dipilih. Nama dan peran aktif ditampilkan pada halaman utama. |
| SRS-03 | Pergantian pengguna | Pengguna dapat berganti peran atau identitas tanpa menghapus perubahan status sesi dan catatan presensi selama aplikasi berjalan. |
| SRS-04 | Navigasi sesuai peran | Praktikan dapat mengakses jadwal, detail sesi, dan riwayat pribadi. Asisten dapat mengakses jadwal, detail sesi, dan rekap. Navigasi kembali tidak mengubah data. |
| SRS-05 | Jadwal praktikan | Praktikan dapat melihat sesi yang diikutinya, meliputi nama praktikum, kelas, lab, tanggal, waktu, dan status sesi. |
| SRS-06 | Jadwal asisten | Asisten dapat melihat sesi yang ditanganinya, meliputi nama praktikum, kelas, lab, tanggal, waktu, dan status sesi. |
| SRS-07 | Detail sesi praktikan | Praktikan dapat melihat nama praktikum, pertemuan, kelas, lab, tanggal, waktu, status sesi, dan status presensi pribadinya. |
| SRS-08 | Detail sesi asisten | Asisten dapat melihat informasi lengkap sesi, ringkasan kehadiran, tombol pengelolaan sesuai status, dan akses menuju rekap. |
| SRS-09 | Pembukaan sesi | Asisten yang menangani sesi dapat mengubah status Belum Dibuka menjadi Dibuka setelah konfirmasi. Sesi yang dibuka dapat menerima presensi. |
| SRS-10 | Penutupan sesi | Asisten dapat mengubah status Dibuka menjadi Ditutup setelah konfirmasi. Presensi baru dinonaktifkan, sedangkan catatan sebelumnya tetap tersedia. |
| SRS-11 | Konfirmasi pengelolaan sesi | Pembukaan dan penutupan sesi menggunakan modal atau bottom sheet yang menampilkan informasi tindakan, tombol konfirmasi, dan tombol batal. Pembatalan tidak mengubah data. |
| SRS-12 | Pelaksanaan presensi | Praktikan terdaftar dapat melakukan presensi ketika sesi Dibuka dan dirinya belum tercatat hadir pada sesi tersebut. |
| SRS-13 | Konfirmasi presensi | Sebelum pencatatan, modal atau bottom sheet menampilkan identitas praktikan dan sesi. Kehadiran hanya dicatat setelah konfirmasi. Pembatalan tidak mencatat kehadiran. |
| SRS-14 | Feedback presensi | Presensi berhasil menampilkan pesan keberhasilan, status Sudah Presensi, dan waktu kehadiran tanpa refresh manual. |
| SRS-15 | Pencegahan presensi ganda | Setiap praktikan hanya memiliki satu catatan kehadiran pada satu sesi. Klik berulang, kunjungan ulang, atau pergantian pengguna tidak menghasilkan duplikasi. |
| SRS-16 | Kondisi tombol presensi | Tombol hanya aktif saat memenuhi syarat. Kondisi lainnya menampilkan Sesi Belum Dibuka, Sudah Presensi, atau Sesi Telah Ditutup dengan aksi nonaktif. |
| SRS-17 | Ringkasan kehadiran | Asisten dapat melihat jumlah seluruh peserta, peserta sudah hadir, dan peserta belum hadir. Total peserta harus sama dengan jumlah hadir ditambah belum hadir. |
| SRS-18 | Daftar kehadiran | Asisten dapat melihat nama, NIM, status kehadiran, dan waktu hadir peserta. Rekap tetap tersedia setelah sesi ditutup. |
| SRS-19 | Filter rekap | Asisten dapat memfilter daftar menjadi Semua, Sudah Hadir, dan Belum Hadir. Filter tidak mengubah data kehadiran. |
| SRS-20 | Riwayat pribadi | Praktikan dapat melihat catatan miliknya sendiri berupa nama sesi, tanggal, status kehadiran, dan waktu hadir jika tersedia. Catatan peserta lain tidak ditampilkan. |
| SRS-21 | Data dummy | Aplikasi menyediakan identitas kedua peran, jadwal, daftar peserta, sesi dengan tiga status, dan contoh catatan kehadiran secara lokal. |
| SRS-22 | State bersama | Kedua peran menggunakan satu sumber state. Perubahan status sesi dan presensi tetap konsisten ketika berganti pengguna dalam aplikasi yang sama. |
| SRS-23 | Kondisi kosong praktikan | Halaman menampilkan pesan yang sesuai ketika praktikan tidak memiliki jadwal atau catatan kehadiran, tanpa menyebabkan error. |
| SRS-24 | Kondisi kosong asisten | Halaman menampilkan pesan ketika asisten tidak memiliki jadwal, sesi tidak memiliki peserta, belum ada peserta hadir, atau filter tidak menghasilkan data. |
| SRS-25 | Validasi perubahan data | Operasi state memeriksa identitas aktif, peran, keterkaitan dengan sesi, status terbaru, dan duplikasi. Tindakan tidak valid ditolak tanpa mengubah data serta memberikan feedback yang jelas. |

### Aturan Status Sesi dan Kehadiran

| Bagian | Aturan |
|---|---|
| Urutan status sesi | Belum Dibuka → Dibuka → Ditutup. |
| Perubahan status | Dilakukan manual oleh asisten yang menangani sesi, bukan otomatis berdasarkan jam. |
| Sesi ditutup | Tidak dapat dibuka kembali pada Sprint 1. |
| Syarat presensi | Praktikan terdaftar, sesi Dibuka, dan belum memiliki catatan pada sesi tersebut. |
| Sudah memiliki catatan | Ditampilkan sebagai Hadir beserta waktu kehadiran, termasuk setelah sesi ditutup. |
| Belum memiliki catatan | Ditampilkan sebagai Belum Presensi selama sesi belum ditutup. |
| Tidak hadir | Setelah sesi ditutup, peserta tanpa catatan ditampilkan sebagai Tidak Hadir pada riwayat. |
| Waktu kehadiran | Menggunakan waktu perangkat saat presensi berhasil dicatat. |
| Pergantian pengguna | Mempertahankan perubahan data selama aplikasi berjalan. |
| Reload penuh | Mengembalikan data dummy ke kondisi awal. |


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