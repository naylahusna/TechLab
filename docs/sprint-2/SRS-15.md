# SRS-15 — Permission Management

**Sprint:** 2
**Owner:** Arga Yura Danendra (Programmer 3 — Permission & AI Integration)  
**Peran terkait:** Petugas pengelola izin yang berwenang; pemohon untuk melihat pengajuannya.

## Tujuan

Menyediakan pengelolaan pengajuan izin bagi petugas yang berwenang.

## Kebutuhan

- Petugas dapat melihat pengajuan dalam cakupan kelas/sesi yang menjadi kewenangannya.
- Daftar dapat dicari atau difilter berdasarkan status dan informasi yang relevan.
- Detail pengajuan menampilkan data yang diperlukan untuk peninjauan, termasuk hasil AI bila tersedia dan diberi label.
- Perubahan administratif dicatat dan tidak menghapus histori keputusan.
- Hak akses dan cakupan petugas ditetapkan melalui aturan akses.

## Kriteria penerimaan

1. Petugas berwenang dapat menemukan dan membuka detail pengajuan dalam cakupannya.
2. Petugas tanpa kewenangan tidak dapat melihat pengajuan terlindungi.
3. Filter tidak mengubah data pengajuan.
4. Perubahan status atau pengelolaan menyimpan jejak perubahan.

## Status

Dokumen ini mencatat kebutuhan Sprint 2; status implementasi harus diverifikasi terpisah.
