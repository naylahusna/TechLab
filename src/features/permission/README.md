# Permission & AI Integration

Modul izin Sprint 2 menggunakan Firebase Auth sebagai identitas dan collection
`permissions` di Firestore sebagai sumber data. UI memakai tema biru/lime Sprint 1.

## Kontrak implementasi

- Routes: tab `/izin`, form `/izin/new?sessionId=...`, detail `/izin/[id]`.
- Satu dokumen per sesi dan praktikan: `${sessionId}_${uid}`.
- Pengajuan hanya oleh peserta aktif, pada sesi `scheduled`/`open`, belum hadir,
  dan belum memiliki pengajuan pada sesi yang sama.
- Keputusan hanya dari asisten kelas terkait, pada status `pending`. Penolakan
  wajib memiliki alasan. Keputusan final tidak dapat ditimpa/dihapus.
- Status, pelaku, waktu server, dan catatan keputusan disimpan. Listener dibersihkan
  saat akun/cakupan berubah. UI tidak menganggap cache sebagai konfirmasi server.
- Presensi dan izin menunggu/disetujui tidak boleh dibuat bersamaan. Jika izin
  ditolak, praktikan masih boleh presensi selama sesi dibuka.
- Tidak ada lampiran wajib pada kebijakan saat ini; formulir berisi jenis dan alasan.
- SRS-14 memakai API chat-completions melalui perantara Node (`npm run ai:server`).
  Salin `.env.ai.example` ke `.env.ai.local` dan isi key hanya di server. URL perantara
  ada di `EXPO_PUBLIC_PERMISSION_AI_URL`; key penyedia tidak boleh menjadi variabel publik.
  Perantara memverifikasi akun Firebase, kepemilikan pengajuan, serta persetujuan AI,
  lalu hanya mengirim teks alasan yang telah tersimpan. Kegagalan tetap ditinjau manual.
- Persetujuan AI tidak dicentang otomatis. Hasil kategori, sumber/model, status, dan waktu
  server disimpan tanpa confidence buatan. Pengajuan tetap tersimpan saat AI gagal.
  AI yang sudah dimulai boleh menyelesaikan metadata setelah keputusan asisten,
  tanpa mengubah keputusan atau pelakunya. Analisis sentimen lokal adalah fitur terpisah.
- Bukti pengujian: `tests/permission.test.ts`, `tests/permission.integration.mjs`,
  `scripts/smoke-permission-web.mjs`. Smoke browser memakai akun seed **lokal**,
  sehingga perlu dataset emulator baru sebelum setiap pengujian.

## Kontribusi prototipe terdahulu

Sprint 1 tidak memiliki modul pengajuan izin.

## Sprint 2

Owner: Arga Yura Danendra (Programmer 3).

- [SRS-13: Permission Submission](../../../docs/sprint-2/SRS-13.md)
- [SRS-14: AI-Based Permission Classification](../../../docs/sprint-2/SRS-14.md)
- [SRS-15: Permission Management](../../../docs/sprint-2/SRS-15.md)
- [SRS-16: Permission Approval and Rejection](../../../docs/sprint-2/SRS-16.md)
- [SRS-17: Permission Status Monitoring](../../../docs/sprint-2/SRS-17.md)

## Sprint 1

Modul permission belum menjadi bagian dari prototipe presensi Sprint 1.

## Pembagian tugas

| Programmer | Owner | Tanggung jawab |
|---|---|---|
| Programmer 3 | Arga Yura Danendra | Owner Sprint 2 SRS-13–17, termasuk kontrak pengajuan, klasifikasi, keputusan, dan status izin. |

## Catatan integrasi

- Hasil AI adalah bantuan klasifikasi dan tidak menggantikan keputusan petugas.
- Akses data izin harus mengikuti matriks role dan security rules.
- Persetujuan pemakaian layanan AI eksternal dan data yang boleh dikirim harus ditetapkan sebelum integrasi.
- Status implementasi setiap kebutuhan harus diverifikasi; dokumentasi ini tidak menyatakan fitur sudah selesai.
