# SRS-15 — Pencegahan Presensi Ganda

Branch: `feature/srs-15-cegah-presensi-ganda`.
Base PR: `feature/srs-25-validasi-aksi`.

Menambahkan `recordAttendance(sessionId, studentId)` ke store/provider bersama.
Aksi memeriksa identitas, pendaftaran, status, dan record terbaru sebelum menulis.
Satu pasangan sesi/praktikan memiliki satu record; aksi berulang ditolak dengan
`ALREADY_PRESENT` dan tidak mengganti waktu atau referensi record sebelumnya.

Pemeriksaan dan penulisan dijalankan sinkron pada snapshot terbaru, sehingga
klik berturut-turut serta callback lama setelah pergantian peran/penutupan sesi
tidak menghasilkan duplikasi. Waktu berasal dari perangkat dan harus valid.
Record sebelumnya dipertahankan setelah sesi ditutup.

Tes mencakup alur demo lintas peran lengkap, 25 percobaan ulang, kunjungan ulang,
record seed, identitas berbeda, sesi berbeda, timestamp, penutupan sesi, reset,
notifikasi subscriber, serta immutability record hasil pencatatan.

Jalankan `npm test`, `npx expo lint`, dan `npx tsc --noEmit`; bundle Android/iOS
memeriksa integrasi provider aplikasi. Pengujian visual di HP belum dilakukan.
UI presensi/modal/rekap tetap menjadi integrasi owner fitur. Tidak ada dependency
tambahan atau backend.

Branch ini berisi hasil gabungan semua tahap 21 → 22 → 25 → 15. Buka PR per
branch dengan base pada `SRS-PR-ORDER.md`, bukan PR dari branch gabungan lama.
