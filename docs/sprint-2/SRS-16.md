# SRS-16 — Permission Approval and Rejection

**Sprint:** 2
**Owner:** Arga Yura Danendra (Programmer 3 — Permission & AI Integration)  
**Peran terkait:** Petugas peninjau yang berwenang; pemohon izin.

## Tujuan

Memungkinkan petugas yang berwenang mengambil dan mencatat keputusan atas pengajuan izin.

## Kebutuhan

- Hanya petugas yang berwenang dapat menyetujui atau menolak pengajuan.
- Keputusan hanya dapat dilakukan pada status yang memenuhi syarat.
- Penolakan menyimpan alasan yang diwajibkan kebijakan.
- Sistem mencatat pelaku keputusan dan waktu keputusan.
- Keputusan tidak dapat diubah diam-diam; koreksi mengikuti alur revisi/audit yang ditetapkan.
- Hasil AI hanya bahan pertimbangan dan tidak menggantikan keputusan petugas.

## Kriteria penerimaan

1. Keputusan valid mengubah status dan menyimpan pelaku serta waktu.
2. Pengguna tidak berwenang atau status yang tidak sesuai ditolak.
3. Penolakan tanpa alasan wajib tidak dapat dikirim.
4. Pemohon dapat melihat hasil keputusan sesuai aturan akses.

## Status

Dokumen ini mencatat kebutuhan Sprint 2; status implementasi harus diverifikasi terpisah.
