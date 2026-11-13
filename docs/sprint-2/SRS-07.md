# SRS-07 — Participant Management

**Sprint:** 2
**Owner:** Zaidan Ardiyansyah (Programmer 2 — Praktikum & Presensi)  
**Peran terkait:** Pengelola kelas yang berwenang; peserta praktikum.

## Tujuan

Mengelola keanggotaan peserta pada kelas praktikum.

## Kebutuhan

- Pengelola berwenang dapat melihat daftar peserta pada kelas yang dikelola.
- Pengelola dapat menambahkan peserta yang terdaftar dan mengubah keanggotaan sesuai izin.
- Sistem mencegah duplikasi peserta dalam kelas yang sama.
- Perubahan keanggotaan tidak menghapus riwayat sesi atau presensi yang sudah tercatat.
- Peran pengelola dan peserta ditentukan melalui SRS-04 dan aturan data.

## Kriteria penerimaan

1. Peserta yang ditambahkan muncul pada daftar kelas yang benar.
2. Duplikasi atau akun yang tidak valid ditolak.
3. Pengguna tanpa izin tidak dapat mengubah roster.
4. Mengakhiri keanggotaan tidak menghapus catatan historis peserta.

## Status

Dokumen ini mencatat kebutuhan Sprint 2; status implementasi harus diverifikasi terpisah.
