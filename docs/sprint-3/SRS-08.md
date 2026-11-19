# SRS-08 — Live User Location Tracking on Map

**Sprint:** 3
**Owner:** Nayla Husna (Programmer 2 — Interactive Laboratory Maps & Live Lab Activity)  
**Peran terkait:** Pengguna yang membuka halaman Maps; layanan geolocation perangkat.

## Tujuan

Menampilkan marker lokasi pengguna pada halaman Maps dan memperbarui posisi marker tersebut secara langsung mengikuti perubahan lokasi perangkat selama halaman digunakan.

## Kebutuhan

- Halaman Maps menampilkan marker atau indikator lokasi pengguna yang dapat dibedakan dari marker laboratorium.
- Selama halaman Maps sedang digunakan, aplikasi berlangganan pembaruan lokasi perangkat (*location watch*) sehingga marker pengguna diperbarui mengikuti perubahan lokasi perangkat.
- Subscription/watcher lokasi perangkat dihentikan dan dibersihkan secara otomatis ketika pengguna meninggalkan halaman Maps (*unmount*) atau keluar dari aplikasi.
- Pengguna dapat memusatkan kembali tampilan peta ke lokasi dirinya atau ke area laboratorium.

## Kriteria penerimaan

1. Posisi pengguna saat ini tampil pada peta dengan penanda yang jelas.
2. Pergerakan atau perubahan koordinat perangkat memperbarui posisi marker pengguna secara langsung selama halaman Maps terbuka.
3. Listener lokasi dibersihkan ketika pengguna menutup halaman Maps sehingga tidak membebani perangkat di latar belakang.
4. Pemusatan kamera peta ke lokasi pengguna bekerja tanpa menghilangkan marker laboratorium.

## Status

Dokumen ini mencatat kebutuhan Sprint 3; status implementasi harus diverifikasi terpisah.
