# SRS-12 — Session Opened Push Notification

**Sprint:** 3
**Owner:** Arga Yura Danendra (Programmer 3 — Push Notification & Device Condition Handling)  
**Peran terkait:** Asisten yang membuka sesi praktikum; praktikan terdaftar pada sesi/kelas terkait; layanan push notification.

## Tujuan

Mengirimkan push notification kepada praktikan terkait ketika asisten membuka sesi praktikum agar praktikan segera mengetahui bahwa presensi telah dibuka tanpa harus terus membuka aplikasi.

## Kebutuhan

- Sistem mendeteksi peristiwa ketika sesi praktikum dibuka oleh asisten (`status` berubah menjadi `open`).
- Sistem menentukan daftar penerima notifikasi hanya kepada praktikan aktif yang terdaftar pada kelas/sesi tersebut.
- Push notification memuat informasi yang jelas, antara lain nama praktikum, kelas, laboratorium, dan pemberitahuan bahwa sesi praktikum telah dibuka.
- Pengguna di luar kelas/sesi terkait tidak boleh menerima notifikasi pembukaan sesi tersebut.

## Kriteria penerimaan

1. Ketika asisten membuka sesi praktikum, sistem mengirimkan push notification kepada praktikan yang terdaftar pada sesi/kelas tersebut.
2. Praktikan yang tidak terdaftar pada kelas tersebut tidak menerima notifikasi pembukaan sesi.
3. Isi notifikasi menampilkan informasi praktikum dan pemberitahuan pembukaan sesi secara jelas.
4. Pembukaan sesi di Cloud Firestore tetap berhasil meskipun terdapat perangkat praktikan yang belum memiliki token aktif.

## Status

Dokumen ini mencatat kebutuhan Sprint 3; status implementasi harus diverifikasi terpisah.
