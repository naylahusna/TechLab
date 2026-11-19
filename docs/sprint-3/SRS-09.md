# SRS-09 — Laboratory Ongoing and Upcoming Activity Information

**Sprint:** 3
**Owner:** Nayla Husna (Programmer 2 — Interactive Laboratory Maps & Live Lab Activity)  
**Peran terkait:** Pengguna yang memilih marker laboratorium pada Maps; koleksi kelas, jadwal, dan sesi di Cloud Firestore.

## Tujuan

Menampilkan informasi praktikum yang sedang berlangsung dan praktikum berikutnya pada setiap laboratorium di peta berdasarkan data jadwal dan sesi yang tersimpan di Cloud Firestore.

## Kebutuhan

- Ketika pengguna memilih marker laboratorium, aplikasi menghubungkan laboratorium tersebut dengan data kelas (`classes`), jadwal (`schedules`), dan sesi (`sessions`) dari Cloud Firestore.
- Aplikasi menampilkan dua informasi aktivitas pada laboratorium yang dipilih:
  - Praktikum yang sedang berlangsung (sesi aktif/dibuka atau jadwal yang berlangsung pada waktu saat ini).
  - Praktikum berikutnya (jadwal aktif terdekat setelah waktu saat ini pada laboratorium tersebut).
- Setiap informasi praktikum yang ditampilkan wajib memuat:
  - Nama praktikum.
  - Kelas praktikum.
  - Waktu pelaksanaan.
  - Status sesi.
- Jadwal yang sudah diarsipkan atau kelas yang diarsipkan tidak ditampilkan sebagai aktivitas aktif.
- Kondisi kosong (sedang tidak ada praktikum berlangsung atau belum ada jadwal berikutnya) ditampilkan dengan keterangan yang jelas.

## Kriteria penerimaan

1. Pemilihan marker laboratorium menampilkan bagian praktikum yang sedang berlangsung dan praktikum berikutnya berdasarkan data Firestore.
2. Setiap entri praktikum memuat nama praktikum, kelas praktikum, waktu pelaksanaan, dan status sesi secara lengkap.
3. Apabila tidak ada praktikum yang berlangsung atau tidak ada praktikum berikutnya, ditampilkan keterangan kosong yang jelas tanpa error.
4. Informasi yang ditampilkan konsisten dengan jadwal dan status sesi pada fitur praktikum lainnya.

## Status

Dokumen ini mencatat kebutuhan Sprint 3; status implementasi harus diverifikasi terpisah.
