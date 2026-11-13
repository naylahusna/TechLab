# SRS-17 — Permission Status Monitoring

**Sprint:** 2
**Owner:** Arga Yura Danendra (Programmer 3 — Permission & AI Integration)  
**Peran terkait:** Pemohon izin; petugas peninjau untuk memantau antrean.

## Tujuan

Memberikan visibilitas terhadap status terkini pengajuan izin dan perubahan keputusan.

## Kebutuhan

- Pemohon dapat melihat status dan riwayat pengajuan miliknya.
- Status yang ditampilkan berasal dari sumber data tersimpan, bukan perkiraan UI.
- Pembaruan status disampaikan sesuai kemampuan sinkronisasi dan kebijakan notifikasi yang disepakati.
- Data pengajuan pengguna lain tidak ditampilkan kepada pemohon.
- Status memuat penjelasan yang sesuai, termasuk alasan penolakan bila tersedia dan boleh ditampilkan.

## Kriteria penerimaan

1. Pemohon dapat melihat status terbaru setiap pengajuan miliknya.
2. Perubahan keputusan tercermin pada tampilan setelah data berhasil diperbarui.
3. Pengguna tidak dapat melihat atau mengubah status pengajuan milik orang lain.
4. Kegagalan memuat status ditampilkan sebagai error, bukan status sukses atau status lama yang menyesatkan.

## Status

Dokumen ini mencatat kebutuhan Sprint 2; status implementasi harus diverifikasi terpisah.
