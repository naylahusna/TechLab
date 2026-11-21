# SRS-17 — QR Code Attendance Verification

**Sprint:** 3
**Owner:** Muhammad Fahri (Programmer 1 — Laboratory Location, Location-Based Attendance & QR Attendance)  
**Peran terkait:** Asisten yang membuka dan mengelola sesi praktikum; praktikan terdaftar yang memindai QR Code pada halaman presensi; kamera perangkat dan Cloud Firestore.

## Tujuan

Menyediakan mekanisme verifikasi presensi berbasis **QR Code sesi** sebagai fitur tambahan opsional Sprint 3 yang ditampilkan oleh asisten dan dipindai oleh praktikan di halaman khusus presensi (`SRS-02`), sehingga keberadaan praktikan di dalam ruangan praktikum terverifikasi melengkapi validasi radius GPS tingkat gedung (`SRS-04`–`05`).

## Kebutuhan

- Saat asisten membuka sesi praktikum (`status == 'open'`), sistem menyediakan token QR unik untuk sesi tersebut (disimpan pada dokumen sesi di Cloud Firestore, mis. `qrToken` dan `qrGeneratedAt`) sehingga hanya sesi aktif yang memiliki QR Code valid.
- Halaman detail sesi asisten menampilkan **QR Code sesi** selama sesi berstatus `open`, beserta opsi memperbarui (*refresh*) token QR apabila diperlukan agar kode sebelumnya tidak lagi berlaku.
- QR Code tidak ditampilkan dan token ditolak apabila sesi berstatus belum dibuka (`scheduled`), sudah ditutup (`closed`), atau dibatalkan (`cancelled`).
- Halaman khusus presensi praktikan (`SRS-02`) menyediakan pemindai kamera (*QR scanner*) untuk memindai QR Code yang ditampilkan oleh asisten.
- Aplikasi menangani izin kamera dan kondisi perangkat (izin kamera ditolak, kamera tidak tersedia/tidak didukung) secara eksplisit dengan pesan yang jelas tanpa menyebabkan *crash*.
- Pencatatan presensi melalui QR Code tetap terintegrasi penuh dengan validasi `SRS-05`: payload QR harus cocok dengan `sessionId` dan `qrToken` aktif sesi tersebut, praktikan terdaftar dan belum hadir/izin, serta validasi lokasi/radius GPS tetap wajib terpenuhi.
- QR Code yang formatnya tidak valid, milik sesi lain, atau menggunakan token lama yang sudah diperbarui wajib ditolak dengan pesan yang jelas tanpa menulis catatan presensi di Cloud Firestore.

## Kriteria penerimaan

1. Asisten dapat menampilkan QR Code sesi ketika sesi dibuka (`open`) serta memperbarui token QR sesi, dan QR tidak lagi berlaku setelah sesi ditutup.
2. Praktikan dapat memindai QR Code sesi dari halaman presensi (`SRS-02`) dan presensi tercatat di Cloud Firestore hanya jika token QR cocok serta seluruh ketentuan `SRS-05` (status sesi dan radius GPS) terpenuhi.
3. Pemindaian QR tidak valid, QR milik sesi lain, QR kedaluwarsa, atau presensi dari luar radius laboratorium ditolak tanpa menulis dokumen kehadiran.
4. Kondisi izin kamera ditolak atau kamera tidak tersedia ditangani dengan pesan yang jelas tanpa membuat aplikasi berhenti (*crash*).

## Status

Dokumen ini mencatat kebutuhan tambahan opsional Sprint 3 (dikerjakan setelah alur wajib `SRS-01`–`05` stabil); status implementasi harus diverifikasi terpisah.
