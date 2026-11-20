# SRS-10 — Real-Time Map Activity Sync and Map Device Handling

**Sprint:** 3
**Owner:** Nayla Husna (Programmer 2 — Interactive Laboratory Maps & Live Lab Activity)  
**Peran terkait:** Pengguna pada halaman Maps; Cloud Firestore real-time listener; layanan lokasi dan jaringan perangkat.

## Tujuan

Memastikan perubahan jadwal atau status sesi langsung tercermin pada informasi aktivitas laboratorium di peta secara *real-time*, serta menangani kondisi izin lokasi, GPS, dan jaringan perangkat pada halaman Maps.

## Kebutuhan

- Halaman Maps menggunakan mekanisme sinkronisasi *real-time* (`onSnapshot`) terhadap data laboratorium, jadwal, dan sesi di Cloud Firestore agar perubahan jadwal atau pembukaan/penutupan sesi langsung tercermin pada informasi aktivitas laboratorium tanpa memuat ulang manual.
- Seluruh listener Firestore pada halaman Maps dibersihkan saat halaman unmount atau pengguna logout.
- Halaman Maps meminta izin lokasi sesuai kebutuhan dan menangani secara jelas kondisi perangkat berikut:
  - Pengguna menolak izin akses lokasi.
  - Layanan lokasi/GPS perangkat tidak aktif.
  - Koordinat lokasi pengguna belum tersedia.
  - Koneksi jaringan mengalami gangguan saat memuat data laboratorium atau aktivitas praktikum.
- Jika izin lokasi ditolak atau GPS tidak aktif, peta dan marker laboratorium tetap dapat dilihat dan dipilih disertai pesan penjelasan bahwa lokasi pengguna tidak tersedia.

## Kriteria penerimaan

1. Perubahan jadwal atau perubahan status sesi oleh asisten langsung tercermin pada panel aktivitas laboratorium di halaman Maps tanpa refresh manual.
2. Penolakan izin lokasi, GPS tidak aktif, atau koordinat belum tersedia menampilkan keterangan yang jelas sementara marker laboratorium tetap dapat diakses.
3. Gangguan koneksi jaringan menampilkan pesan error yang informatif disertai tombol coba lagi tanpa crash.
4. Listener Firestore dan lokasi tidak menyisakan kebocoran memori setelah halaman ditutup.

## Status

Dokumen ini mencatat kebutuhan Sprint 3; status implementasi harus diverifikasi terpisah.
