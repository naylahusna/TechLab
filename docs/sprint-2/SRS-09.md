# SRS-09 — Practicum Session Management

**Sprint:** 2
**Owner:** Zaidan Ardiyansyah (Programmer 2 — Praktikum & Presensi)  
**Peran terkait:** Asisten/pengelola sesi yang ditugaskan; peserta sesi.

## Tujuan

Mengelola sesi praktikum yang dibuat dari jadwal dan memastikan perubahan status hanya dilakukan pihak berwenang.

## Kebutuhan

- Sesi terkait ke jadwal/kelas yang valid dan memiliki penanggung jawab.
- Pengelola yang ditugaskan dapat memulai atau mengakhiri sesi sesuai transisi status yang ditetapkan.
- Perubahan status memiliki waktu perubahan dan identitas pelaku yang dapat diaudit.
- Sesi yang sudah berakhir tidak dibuka ulang kecuali kebijakan khusus mengizinkan.
- Hak pengelola harus diperiksa oleh sistem.

## Kriteria penerimaan

1. Pengelola yang ditugaskan dapat melakukan transisi status yang valid.
2. Pengguna lain dan transisi status yang tidak valid ditolak.
3. Status terbaru terlihat pada layar terkait.
4. Riwayat kehadiran yang sudah ada tetap tersedia setelah sesi berakhir.

## Status

Dokumen ini mencatat kebutuhan Sprint 2; status implementasi harus diverifikasi terpisah.
