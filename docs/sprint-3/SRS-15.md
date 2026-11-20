# SRS-15 — Notification Permission, Delivery, and Error Handling

**Sprint:** 3
**Owner:** Arga Yura Danendra (Programmer 3 — Push Notification & Device Condition Handling)  
**Peran terkait:** Seluruh pengguna aplikasi; layanan notifikasi dan jaringan perangkat.

## Tujuan

Menangani kondisi izin notifikasi dan kendala perangkat/jaringan secara jelas sehingga pengguna memahami status penerimaan notifikasi dan aplikasi tetap berjalan stabil.

## Kebutuhan

- Aplikasi memeriksa status izin akses notifikasi dan menampilkannya secara jelas kepada pengguna.
- Aplikasi menangani secara eksplisit kondisi berikut:
  - Pengguna menolak izin akses notifikasi.
  - Token notifikasi tidak tersedia atau perangkat tidak mendukung push notification.
  - Koneksi jaringan mengalami gangguan saat mendaftarkan token atau mengirim/menerima notifikasi.
  - Notifikasi tidak dapat diterima oleh perangkat.
- Aplikasi memberikan informasi yang jelas agar pengguna memahami kondisi tersebut dan cara mengaktifkannya kembali bila diperlukan.
- Kegagalan pengiriman atau penerimaan push notification tidak boleh menggagalkan transaksi utama di Cloud Firestore (pembukaan sesi, perubahan jadwal, atau keputusan pengajuan izin).

## Kriteria penerimaan

1. Apabila pengguna menolak izin notifikasi, aplikasi tidak crash dan menampilkan keterangan jelas bahwa pemberitahuan tidak aktif.
2. Gangguan jaringan atau kegagalan pengiriman notifikasi ditangani secara aman dan menampilkan informasi yang dapat dipahami pengguna.
3. Pembukaan sesi, perubahan jadwal, dan keputusan izin tetap tersimpan konsisten meskipun layanan notifikasi sedang tidak tersedia.
4. Pengguna tetap dapat melihat status terbaru sesi, jadwal, dan izin melalui layar di dalam aplikasi ketika notifikasi tidak dapat diterima.

## Status

Dokumen ini mencatat kebutuhan Sprint 3; status implementasi harus diverifikasi terpisah.
