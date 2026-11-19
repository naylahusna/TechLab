# SRS-05 — Location-Verified Attendance Recording

**Sprint:** 3
**Owner:** Muhammad Fahri (Programmer 1 — Laboratory Location & Location-Based Attendance)  
**Peran terkait:** Praktikan terdaftar; asisten yang memantau rekap kehadiran; Cloud Firestore.

## Tujuan

Menjadikan validasi lokasi sebagai bagian wajib dari proses pencatatan presensi ke Cloud Firestore sehingga presensi yang tidak memenuhi ketentuan sesi atau lokasi ditolak dan kehadiran tetap konsisten antar pengguna.

## Kebutuhan

- Validasi lokasi merupakan bagian dari proses pencatatan presensi, bukan sekadar informasi visual pada antarmuka.
- Presensi hanya dapat dicatat apabila seluruh syarat terpenuhi:
  - Sesi sedang dibuka (`status == 'open'`).
  - Praktikan terdaftar aktif pada kelas/sesi tersebut dan tidak memiliki izin menunggu/disetujui.
  - Koordinat lokasi perangkat berhasil diperoleh dan berada di dalam radius lokasi laboratorium yang diizinkan.
  - Praktikan belum memiliki catatan presensi pada sesi yang sama.
- Presensi yang tidak memenuhi ketentuan sesi atau lokasi wajib ditolak dan tidak boleh dicatat sebagai kehadiran berhasil di Cloud Firestore.
- Pengguna tidak boleh melakukan presensi lebih dari satu kali pada sesi yang sama.
- Catatan presensi yang berhasil langsung tercermin pada rekap kehadiran asisten dan riwayat pribadi praktikan.

## Kriteria penerimaan

1. Presensi berhasil tercatat di Firestore hanya ketika sesi dibuka dan posisi perangkat berada dalam radius laboratorium.
2. Percobaan presensi di luar radius, tanpa koordinat lokasi, atau saat sesi belum dibuka/sudah ditutup ditolak tanpa menulis dokumen kehadiran.
3. Percobaan presensi berulang pada sesi yang sama ditolak dan tidak menghasilkan duplikasi catatan.
4. Setelah presensi berhasil, asisten langsung melihat kehadiran praktikan tersebut pada rekap sesi.

## Status

Dokumen ini mencatat kebutuhan Sprint 3; status implementasi harus diverifikasi terpisah.
