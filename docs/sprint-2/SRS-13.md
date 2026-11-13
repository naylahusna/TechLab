# SRS-13 — Permission Submission

**Sprint:** 2
**Owner:** Arga Yura Danendra (Programmer 3 — Permission & AI Integration)  
**Peran terkait:** Peserta/praktikan yang mengajukan izin.

## Tujuan

Memungkinkan peserta mengajukan izin terkait sesi praktikum.

## Kebutuhan

- Pengajuan mengaitkan pemohon dan sesi yang valid.
- Form memuat jenis/alasan izin dan rentang atau waktu terkait sesuai kebijakan.
- Bukti pendukung dapat disertakan bila kebijakan mengharuskannya; tipe dan ukuran file dibatasi.
- Status awal pengajuan ditetapkan sistem dan tidak dapat dipilih atau diubah oleh pemohon.
- Pemohon hanya dapat melihat dan mengelola pengajuan miliknya, sesuai aturan yang ditetapkan.

## Kriteria penerimaan

1. Pengajuan dengan data wajib valid tersimpan dan memiliki identifier serta status awal.
2. Pengajuan invalid, sesi tidak valid, atau data milik pengguna lain ditolak.
3. Bukti yang tidak sesuai batasan ditolak dengan pesan yang jelas.
4. Pemohon menerima konfirmasi hanya setelah penyimpanan berhasil.

## Status

Dokumen ini mencatat kebutuhan Sprint 2; status implementasi harus diverifikasi terpisah.
