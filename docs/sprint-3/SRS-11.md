# SRS-11 — Push Notification Foundation and Device Token Management

**Sprint:** 3
**Owner:** Arga Yura Danendra (Programmer 3 — Push Notification & Device Condition Handling)  
**Peran terkait:** Pengguna terautentikasi (praktikan dan asisten); Firebase Cloud Messaging (FCM) / layanan push notification; Cloud Firestore.

## Tujuan

Menyiapkan fondasi layanan push notification (FCM atau mekanisme push notification yang sesuai) dan pengelolaan token perangkat pengguna di Cloud Firestore agar notifikasi dapat dikirimkan secara tepat sasaran.

## Kebutuhan

- Aplikasi mengonfigurasi layanan push notification serta channel notifikasi Android sesuai kebutuhan perangkat.
- Setelah pengguna terautentikasi, aplikasi meminta izin akses notifikasi dan mendaftarkan token push perangkat aktif ke Cloud Firestore yang terikat dengan UID pengguna.
- Penyimpanan dan pembaruan token perangkat dilindungi Firestore Security Rules sehingga pengguna hanya dapat mengelola token milik akunnya sendiri.
- Ketika pengguna melakukan logout, kaitan token perangkat aktif untuk akun tersebut dinonaktifkan atau dihapus agar notifikasi tidak terkirim ke akun yang sudah keluar.
- Kredensial server/rahasia pengiriman push notification tidak boleh disimpan pada kode klien atau repository publik.

## Kriteria penerimaan

1. Aplikasi dapat menginisialisasi layanan push notification dan memperoleh token perangkat saat izin notifikasi diberikan.
2. Token perangkat tersimpan di Cloud Firestore sesuai UID pengguna aktif dan terlindungi oleh Security Rules.
3. Logout menonaktifkan atau membersihkan token perangkat dari akun yang keluar.
4. Tidak ada secret key atau server credential yang tersimpan di bundle aplikasi klien.

## Status

Dokumen ini mencatat kebutuhan Sprint 3; status implementasi harus diverifikasi terpisah.
