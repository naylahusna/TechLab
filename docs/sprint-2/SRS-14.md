# SRS-14 — AI-Based Permission Classification

**Sprint:** 2
**Owner:** Arga Yura Danendra (Programmer 3 — Permission & AI Integration)  
**Peran terkait:** Layanan klasifikasi AI; pemohon dan petugas peninjau.

## Tujuan

Memberikan klasifikasi awal terhadap pengajuan izin untuk membantu proses peninjauan.

## Kebutuhan

- Sistem mengirim hanya data minimum yang diperlukan ke layanan klasifikasi yang disetujui.
- Hasil AI berupa saran kategori/indikasi, bukan keputusan final otomatis.
- Hasil klasifikasi dan waktu/provenansnya dicatat agar dapat ditinjau.
- Kegagalan atau hasil tidak pasti ditandai untuk peninjauan manual.
- Data pribadi dan bukti pengajuan tidak dikirim ke layanan pihak ketiga sebelum kebijakan privasi dan persetujuan ditetapkan.

## Kriteria penerimaan

1. Pengajuan menerima hasil klasifikasi atau status bahwa klasifikasi tidak tersedia.
2. Hasil AI tidak mengubah status menjadi disetujui/ditolak dengan sendirinya.
3. Petugas dapat melihat bahwa klasifikasi merupakan bantuan otomatis.
4. Error layanan tidak menghilangkan pengajuan dan dapat ditindaklanjuti secara manual.

## Status

Dokumen ini mencatat kebutuhan Sprint 2; status implementasi harus diverifikasi terpisah.
