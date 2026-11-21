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

## Batasan Sprint 1

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

Setelah melakukan clone repository, buka terminal pada folder yang berisi `package.json`:

```bash
npm ci
```

Gunakan npm dan `package-lock.json` yang tersedia agar dependency seluruh anggota konsisten.

## Pengembangan dengan EAS

Konfigurasi akun Expo, proyek EAS, dan build belum dilakukan pada fondasi awal ini.

Programmer yang menangani fondasi bertanggung jawab untuk:

1. Menyiapkan konfigurasi EAS pada akun yang disepakati tim.
2. Menyiapkan development build jika digunakan untuk pengembangan.
3. Menyiapkan build APK untuk demonstrasi.
4. Memperbarui bagian ini dengan langkah menjalankan yang sudah diuji.

Seluruh anggota menggunakan proyek EAS yang sama. Pergantian PM tidak memerlukan pembuatan proyek EAS baru.

## Software Requirements Specification — Sprint 1

SRS Sprint 1 adalah kebutuhan prototipe presensi berikut. Seluruh kebutuhan menggunakan data dummy dan state lokal, tanpa backend atau sinkronisasi antarperangkat.

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

## Pembagian Tugas — Sprint 1

| Programmer | Tanggung Jawab | Kode SRS |
|---|---|---|
| Arga Yura Danendra | Fondasi aplikasi, pemilihan pengguna, navigasi, data dummy, shared state, dan validasi | SRS-01, SRS-02, SRS-03, SRS-04, SRS-15, SRS-21, SRS-22, SRS-25 |
| Muhammad Zaidaan Ardiyansyah | Jadwal, detail sesi, presensi, feedback, riwayat, dan kondisi kosong praktikan | SRS-05, SRS-07, SRS-12, SRS-13, SRS-14, SRS-16, SRS-20, SRS-23 |
| Muhammad Fahri | Jadwal, detail sesi, buka/tutup sesi, rekap, filter, dan kondisi kosong asisten | SRS-06, SRS-08, SRS-09, SRS-10, SRS-11, SRS-17, SRS-18, SRS-19, SRS-24 |

Arga menyediakan fondasi data dan fungsi bersama terlebih dahulu. Zaidaan dan Fahri menggunakan fondasi tersebut pada antarmuka masing-masing.

## Aturan Kolaborasi

- `main` digunakan untuk versi stabil yang telah diperiksa.
- `develop` digunakan untuk integrasi pekerjaan.
- Setiap programmer bekerja pada branch fitur masing-masing.
- Perubahan diajukan melalui pull request ke `develop`.
- Pull request mencantumkan kode SRS, ringkasan perubahan, hasil pengujian, dan kendala.
- PM minggu berjalan melakukan review dan merge bersama pemilik kode jika ada konflik.
- Setelah pengujian selesai, `develop` digabungkan ke `main`.

## Target Demonstrasi Sprint 1

1. Asisten membuka sesi.
2. Pengguna berganti menjadi praktikan.
3. Praktikan melakukan presensi satu kali.
4. Pengguna berganti menjadi asisten.
5. Asisten melihat rekap dan waktu kehadiran.
6. Asisten menutup sesi.
7. Praktikan tidak dapat melakukan presensi setelah sesi ditutup.

Informasi sesi dan kehadiran harus konsisten pada kedua peran.

## Software Requirements Specification — Sprint 2

Sprint 2 menambahkan kebutuhan Firebase & Authentication, Praktikum & Presensi, dan Permission & AI Integration. Daftar ini adalah kebutuhan baru Sprint 2; tidak menggantikan kebutuhan dan pembagian Sprint 1 di atas.

Rincian spesifikasi Sprint 2 terdapat di `docs/sprint-2/`.

| Kode SRS Sprint 2 | Kebutuhan | Owner |
|---|---|---|
| SRS-00 | Firebase Foundation | Nayla Husna |
| SRS-01 | User Registration | Nayla Husna |
| SRS-02 | User Login | Nayla Husna |
| SRS-03 | User Logout | Nayla Husna |
| SRS-04 | Role-Based Access Control | Nayla Husna |
| SRS-05 | User Profile Management | Nayla Husna |
| SRS-06 | Class Management | Zaidan Ardiyansyah |
| SRS-07 | Participant Management | Zaidan Ardiyansyah |
| SRS-08 | Schedule Management | Zaidan Ardiyansyah |
| SRS-09 | Practicum Session Management | Zaidan Ardiyansyah |
| SRS-10 | Practicum Attendance | Zaidan Ardiyansyah |
| SRS-11 | Attendance Recapitulation | Zaidan Ardiyansyah |
| SRS-12 | Real-Time Attendance Synchronization | Zaidan Ardiyansyah |
| SRS-13 | Permission Submission | Arga Yura Danendra |
| SRS-14 | AI-Based Permission Classification | Arga Yura Danendra |
| SRS-15 | Permission Management | Arga Yura Danendra |
| SRS-16 | Permission Approval and Rejection | Arga Yura Danendra |
| SRS-17 | Permission Status Monitoring | Arga Yura Danendra |

### Pembagian Programmer — Sprint 2

1. **Nayla Husna — Firebase Foundation & Authentication:** SRS-00 sampai SRS-05.
2. **Zaidan Ardiyansyah — Praktikum & Presensi:** SRS-06 sampai SRS-12.
3. **Arga Yura Danendra — Permission & AI Integration:** SRS-13 sampai SRS-17.

### Catatan Integrasi Sprint 2

- Nomor SRS Sprint 2 memiliki arti berbeda dari nomor yang sama pada tabel Sprint 1; gunakan label sprint atau folder `docs/sprint-2/` saat merujuknya.
- Kriteria, implementasi, dan pengujian setiap kebutuhan Sprint 2 dicatat pada dokumen masing-masing.
- Perubahan lintas owner dikoordinasikan bersama sebelum diintegrasikan.

## Software Requirements Specification — Sprint 3

Sprint 3 (**Location-Based Attendance, Maps, and Push Notification**) mengembangkan aplikasi dari Sprint 1 dan Sprint 2 dengan memanfaatkan lokasi perangkat (*geolocation*), peta interaktif (*Maps*) persebaran laboratorium Informatika beserta aktivitas praktikumnya, serta *push notification* untuk peristiwa penting aplikasi. Daftar ini adalah kebutuhan baru Sprint 3; tidak menggantikan kebutuhan dan pembagian Sprint 1 maupun Sprint 2 di atas.

Rincian spesifikasi Sprint 3 terdapat di `docs/sprint-3/`.

| Kode SRS Sprint 3 | Kebutuhan | Owner | Urutan Kerja |
|---|---|---|---|
| SRS-01 | Laboratory Location and Radius Management | Muhammad Fahri | 1/6 (Wajib Paling Awal) |
| SRS-02 | Dedicated Attendance Page | Muhammad Fahri | 2/6 (Berurut) |
| SRS-03 | Device Geolocation and Location Permission Handling | Muhammad Fahri | 3/6 (Berurut) |
| SRS-04 | Attendance Radius Validation | Muhammad Fahri | 4/6 (Berurut) |
| SRS-05 | Location-Verified Attendance Recording | Muhammad Fahri | 5/6 (Berurut) |
| SRS-06 | Interactive Laboratory Map Page | Nayla Husna | 1/6 (Setelah SRS-01) |
| SRS-07 | Laboratory Markers and Detail Selection | Nayla Husna | 2/6 (Berurut) |
| SRS-08 | Live User Location Tracking on Map | Nayla Husna | 3/6 (Berurut) |
| SRS-09 | Laboratory Ongoing and Upcoming Activity Information | Nayla Husna | 4/6 (Berurut) |
| SRS-10 | Real-Time Map Activity Sync and Map Device Handling | Nayla Husna | 5/6 (Berurut) |
| SRS-11 | Push Notification Foundation and Device Token Management | Arga Yura Danendra | 1/5 (Langsung Mulai) |
| SRS-12 | Session Opened Push Notification | Arga Yura Danendra | 2/5 (Berurut) |
| SRS-13 | Schedule Change Push Notification | Arga Yura Danendra | 3/5 (Berurut) |
| SRS-14 | Permission Decision Push Notification | Arga Yura Danendra | 4/5 (Berurut) |
| SRS-15 | Notification Permission, Delivery, and Error Handling | Arga Yura Danendra | 5/5 (Berurut) |
| SRS-16 | Lab Admin Role and Assistant Account Management | Nayla Husna | 6/6 (Setelah SRS-10) |
| SRS-17 | QR Code Attendance Verification *(Opsional)* | Muhammad Fahri | 6/6 (Setelah SRS-05) |

### Susunan Tim — Sprint 3

- **Project Manager (PM):** **Muhammad Zaidaan Ardiyansyah** — Koordinasi kontrak data Firestore, review/merge PR, dan verifikasi integrasi Sprint 3.
1. **Muhammad Fahri (Programmer 1) — Laboratory Location, Location-Based Attendance & QR Attendance:** SRS-01 sampai SRS-05, dan SRS-17 *(opsional)*.
2. **Nayla Husna (Programmer 2) — Interactive Laboratory Maps, Live Lab Activity & Lab Admin RBAC:** SRS-06 sampai SRS-10, dan SRS-16.
3. **Arga Yura Danendra (Programmer 3) — Push Notification & Device Condition Handling:** SRS-11 sampai SRS-15.

### Target Demonstrasi Sprint 3

1. **Alur 1 — Presensi Berbasis Lokasi (`SRS-01`–`05`, opsional + QR `SRS-17`):** Asisten membuka sesi praktikum → praktikan membuka halaman khusus presensi → aplikasi memeriksa lokasi perangkat dan radius laboratorium (serta pemindaian QR sesi bila diaktifkan) → presensi berhasil dicatat apabila seluruh ketentuan terpenuhi → asisten melihat rekap kehadiran praktikan.
2. **Alur 2 — Peta dan Informasi Laboratorium (`SRS-06`–`10`):** Pengguna membuka halaman Maps → aplikasi menampilkan posisi pengguna (*live*) dan marker laboratorium → pengguna memilih salah satu marker laboratorium → aplikasi menampilkan praktikum yang sedang berlangsung dan praktikum berikutnya (nama praktikum, kelas, waktu pelaksanaan, status sesi) berdasarkan data Firestore.
3. **Alur 3 — Notifikasi Kegiatan (`SRS-11`–`15`):** Asisten membuka sesi, mengubah jadwal, atau memberikan keputusan izin (diterima/ditolak) → sistem mendeteksi peristiwa tersebut → sistem mengirimkan *push notification* kepada pengguna terkait → pengguna menerima pemberitahuan.

### Catatan Integrasi Sprint 3

- Nomor SRS Sprint 3 memiliki arti berbeda dari nomor yang sama pada Sprint 1 dan Sprint 2; gunakan label sprint atau folder `docs/sprint-3/` saat merujuknya.
- Validasi lokasi wajib menjadi bagian dari proses pencatatan presensi ke Firestore, bukan sekadar informasi visual pada antarmuka.
- Urutan kerja dan ketergantungan lintas programmer dicatat pada `docs/sprint-3/SRS-PR-ORDER.md`.
- Referensi materi:
  - Push Notification: https://medium.com/@silverskytechnology/rich-push-notifications-in-react-native-a-complete-guide-797dd9747366
  - Maps: https://medium.com/@silverskytechnology/implementing-google-maps-and-routes-tracking-in-react-native-a-starter-guide-9768282594b8
