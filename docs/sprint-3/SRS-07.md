# SRS-07 — Laboratory Markers and Detail Selection

**Sprint:** 3
**Owner:** Nayla Husna (Programmer 2 — Interactive Laboratory Maps & Live Lab Activity)  
**Peran terkait:** Pengguna yang berinteraksi dengan peta laboratorium; data laboratorium Firestore (`SRS-01`).

## Tujuan

Menampilkan setiap laboratorium di lingkungan Informatika menggunakan marker pada peta dan memungkinkan pengguna memilih marker untuk melihat detail informasi laboratorium tersebut.

## Kebutuhan

- Setiap laboratorium yang tersimpan di Cloud Firestore ditampilkan menggunakan marker pada titik koordinat (`latitude`, `longitude`) masing-masing di peta.
- Marker laboratorium yang sedang dipilih memiliki pembeda visual yang jelas.
- Pengguna dapat memilih (*tap*) salah satu marker laboratorium untuk membuka panel/kartu informasi laboratorium tersebut (nama laboratorium, informasi lokasi/gedung, radius presensi, dan ringkasan aktivitasnya).
- Pengguna dapat berpindah memilih marker laboratorium lain atau menutup panel detail laboratorium dengan mulus.

## Kriteria penerimaan

1. Seluruh laboratorium aktif dari Cloud Firestore tampil sebagai marker pada koordinat yang tepat di peta.
2. Memilih salah satu marker laboratorium menampilkan panel informasi laboratorium yang sesuai.
3. Memilih marker laboratorium lain langsung memperbarui isi panel informasi sesuai laboratorium baru yang dipilih.
4. Panel detail laboratorium dapat ditutup untuk kembali melihat peta secara penuh.

## Status

Dokumen ini mencatat kebutuhan Sprint 3; status implementasi harus diverifikasi terpisah.
