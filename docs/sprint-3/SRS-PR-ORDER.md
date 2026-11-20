# Urutan Implementasi SRS — Sprint 3

Dokumen ini mencatat aturan urutan pengerjaan dan dependensi tingkat tinggi untuk kebutuhan Sprint 3 (`SRS-01`–`16`). Ketiga programmer dapat bekerja secara **paralel antar-jalur**, dengan pengerjaan **berurut di dalam tugas masing-masing**.

## Aturan Urutan Kerja (3 Jalur)

1. **Jalur 1 — Muhammad Fahri (`SRS-01` → `SRS-02` → `SRS-03` → `SRS-04` → `SRS-05`).**
   - **`SRS-01` (Laboratory Location and Radius Management)** diprioritaskan paling awal dan di-merge terlebih dahulu ke `main`, karena koleksi lokasi laboratorium di Cloud Firestore menjadi sumber data bersama untuk halaman Presensi dan halaman Maps.
   - Setelah `SRS-01` selesai, lanjutkan berurut ke `SRS-02` (halaman presensi khusus), `SRS-03` (izin & geolocation perangkat), `SRS-04` (validasi radius), dan `SRS-05` (pencatatan presensi terverifikasi lokasi).
2. **Jalur 2 — Nayla Husna (`SRS-06` → `SRS-07` → `SRS-08` → `SRS-09` → `SRS-10` → `SRS-16`).**
   - Tidak perlu menunggu seluruh SRS Fahri selesai; cukup menunggu **`SRS-01`** masuk (atau menyiapkan halaman Maps dasar terlebih dahulu menggunakan kontrak koleksi laboratorium yang telah disepakati).
   - Lanjutkan berurut dari `SRS-06` (halaman Maps), `SRS-07` (marker lab & pemilihan detail), `SRS-08` (live lokasi pengguna), `SRS-09` (informasi praktikum berlangsung & berikutnya), hingga `SRS-10` (sinkronisasi real-time & penanganan kondisi perangkat).
   - Setelah fitur Maps (`SRS-06`–`10`) stabil, lanjutkan ke **`SRS-16`** (role Admin Lab untuk promosi/pencabutan role asisten serta akses master lab & Maps).
3. **Jalur 3 — Arga Yura Danendra (`SRS-11` → `SRS-12` → `SRS-13` → `SRS-14` → `SRS-15`).**
   - Dapat langsung dimulai sejak hari pertama tanpa menunggu Fahri maupun Nayla, karena pemicu notifikasi (pembukaan sesi, perubahan jadwal, keputusan izin) terhubung pada fitur Sprint 2 yang sudah tersedia.
   - Mulai dari `SRS-11` (fondasi push notification & token perangkat), dilanjutkan ke trigger notifikasi `SRS-12` (sesi dibuka), `SRS-13` (jadwal berubah), `SRS-14` (keputusan izin diterima/ditolak), dan ditutup `SRS-15` (penanganan izin notifikasi & gangguan pengiriman).

## Target Demonstrasi Sprint 3

1. **Alur 1 — Presensi Berbasis Lokasi (`SRS-01`–`05`):** Asisten membuka sesi → praktikan membuka halaman khusus presensi → aplikasi memeriksa lokasi perangkat dan radius lab → presensi tercatat jika memenuhi syarat → asisten melihat rekap kehadiran.
2. **Alur 2 — Peta dan Informasi Laboratorium (`SRS-06`–`10`):** Pengguna membuka halaman Maps → aplikasi menampilkan posisi pengguna dan marker lab → pengguna memilih marker lab → tampil praktikum sedang berlangsung dan praktikum berikutnya dari Firestore.
3. **Alur 3 — Notifikasi Kegiatan (`SRS-11`–`15`):** Asisten membuka sesi, mengubah jadwal, atau memutuskan izin → sistem mendeteksi peristiwa dan mengirim push notification → pengguna terkait menerima pemberitahuan.

## Dokumen terkait

- [SRS Ownership Sprint 3](./SRS-OWNERSHIP.md)
- [Daftar SRS Sprint 3 di README](../../README.md)
- SRS Sprint 2 dan urutan implementasinya berada di `../sprint-2/`.
- SRS prototipe Sprint 1 dan urutan PR terdahulunya berada di `../sprint-1/`.
