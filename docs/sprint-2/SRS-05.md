# SRS-05 — User Profile Management

**Sprint:** 2
**Owner:** Nayla Husna (Programmer 1 — Firebase Foundation & Authentication)  
**Peran terkait:** Pengguna terautentikasi.

## Tujuan

Memungkinkan pengguna melihat dan memperbarui informasi profil yang boleh dikelola sendiri.

## Kebutuhan

- Profil menampilkan informasi akun yang relevan dan role aktif.
- Pengguna dapat memperbarui field profil yang diizinkan.
- UID dan role otorisasi tidak dapat diubah sebagai field profil biasa oleh pengguna.
- Perubahan disimpan ke sumber data yang disepakati dan kegagalannya ditampilkan.
- Informasi sensitif tidak ditampilkan atau dicatat tanpa kebutuhan dan izin.

## Kriteria penerimaan

1. Profil memuat data akun yang terhubung ke UID pengguna saat ini.
2. Perubahan field yang diizinkan tersimpan dan tampil kembali setelah pemuatan ulang.
3. Field terlarang tidak dapat diubah dengan manipulasi UI atau request klien.
4. Error penyimpanan tidak menampilkan konfirmasi sukses.

## Status

Dokumen ini mencatat kebutuhan Sprint 2; status implementasi harus diverifikasi terpisah.
