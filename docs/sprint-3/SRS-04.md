# SRS-04 — Attendance Radius Validation

**Sprint:** 3
**Owner:** Muhammad Fahri (Programmer 1 — Laboratory Location & Location-Based Attendance)  
**Peran terkait:** Praktikan pada halaman presensi; data koordinat dan radius laboratorium (`SRS-01`).

## Tujuan

Memeriksa keberadaan fisik praktikan berdasarkan koordinat perangkat terhadap koordinat dan radius laboratorium yang tersimpan di Cloud Firestore serta menampilkan hasil pemeriksaan lokasi secara jelas.

## Kebutuhan

- Sistem menghitung jarak fisik (dalam meter) antara koordinat perangkat praktikan dengan titik koordinat laboratorium yang digunakan pada sesi.
- Sistem membandingkan jarak terukur terhadap radius presensi laboratorium yang berlaku (`distanceMeters <= radiusMeters`).
- Halaman presensi menampilkan hasil pemeriksaan lokasi secara jelas, mencakup status berada di dalam radius atau di luar radius beserta informasi jarak terhadap batas radius.
- Aplikasi memberikan informasi yang jelas apabila praktikan berada di luar radius yang diizinkan atau lokasi tidak dapat diperoleh.
- Hasil pemeriksaan lokasi diperbarui ketika praktikan berpindah atau melakukan pemeriksaan ulang lokasi.

## Kriteria penerimaan

1. Perhitungan jarak antara posisi perangkat dan koordinat laboratorium akurat dalam satuan meter.
2. Halaman menampilkan status memenuhi syarat (di dalam radius) apabila jarak `<=` radius laboratorium.
3. Halaman menampilkan peringatan jelas (di luar radius) apabila jarak `>` radius laboratorium.
4. Apabila koordinat perangkat atau lokasi laboratorium tidak tersedia, status validasi tidak boleh dianggap memenuhi syarat.

## Status

Dokumen ini mencatat kebutuhan Sprint 3; status implementasi harus diverifikasi terpisah.
