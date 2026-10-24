# SRS-22 — State Bersama

Branch: `feature/srs-22-state-bersama`.
Base PR: `feature/srs-21-data-dummy`.

Satu snapshot menyimpan pengguna aktif, sesi, peserta, dan catatan kehadiran.
Provider dipasang sekali di root. `RoleProvider` dan `useRole()` lama adalah
alias ke provider/hook demo; semua screen lama tetap kompatibel.

`useDemo()` dan selector diekspor dari `src/core/index.ts`. Pergantian
pengguna mempertahankan referensi sesi/record, tidak membuat store per peran.
Data readonly dibekukan untuk mencegah perubahan langsung di UI.

Tahap ini menyediakan pembacaan data, pemilihan pengguna, serta reset demo.
Aksi sesi tervalidasi ditambahkan pada SRS-25, pencatatan presensi pada SRS-15.
Dengan demikian setiap branch tetap dapat dijalankan tanpa aksi setengah jadi.

Tes mencakup pergantian peran, isolasi snapshot per provider, reset, subscription,
kompatibilitas boolean, serta selector sesuai pengguna. Jalankan `npm test`,
`npx expo lint`, dan `npx tsc --noEmit`. Lihat `CORE-API.md` dan `SRS-PR-ORDER.md`.

## Perbaikan integrasi UI

Branch lanjutan: `fix/srs-22-integrasi-state`, berbasis `main` setelah integrasi praktikan.
Jadwal, detail, dan rekap asisten diadaptasi dari UI Fahri pada branch
`feature/srs-24-Informasi-jadwal-rekap-kosong` (commit `1ae76dd`).
Seluruh layar membaca `useDemo()` yang sama dengan praktikan. Tidak ada
`assistantSessions`, `sessionStatuses`, provider, atau seed presensi kedua.

- `src/features/assistant/session-view.ts` membentuk view dari selector core;
  objek sesi dan record tetap berasal dari snapshot yang sama.
- Route tab jadwal menggunakan `AssistantJadwalScreen`, tab catatan menggunakan
  `AssistantRekapScreen`, dan route tunggal `src/app/sesi/[id].tsx` memilih
  `AssistantSessionDetailScreen` atau layar praktikan sesuai peran dan penugasan.
  Props jadwal, rekap, roster, dan waktu presensi dipetakan dari selector core.
  Jangan menambah `[sessionId].tsx` dengan pola URL yang sama.
- Buka/tutup menggunakan `ActionResult` dari `demo.openSession()` dan
  `demo.closeSession()`. Konfirmasi yang dibatalkan tidak memanggil aksi store.
- Rekap mengambil roster dari `studentIds` sesi dan waktu dari `recordedAt`.
  Filter hanya state tampilan; pergantian pengguna tidak mereset sesi/record.
- State lokal konfirmasi/filter/feedback detail direset dengan key identitas+sesi.

Saat mengintegrasikan branch asisten lama, pertahankan `role-context.tsx` sebagai
alias ke `DemoProvider`, gunakan ID `sesi-…`, dan port penyesuaian UI ke komponen
asisten ini. Jangan mengganti core dengan `session-state.ts` dari branch lama.
Ini memerlukan peninjauan integrasi bersama Fahri/PM, bukan merge otomatis.

Tes `tests/role-integration.test.ts` menguji view yang dipakai layar kedua peran,
termasuk buka → ganti pengguna → presensi → rekap/filter → tutup → ganti pengguna,
record/waktu yang sama, empty state, penugasan, dan callback lama.

### Uji manual di satu aplikasi tanpa reload

1. Pilih Asisten Dimas, buka jadwal dan detail PPK pertemuan 5 (`sesi-01`).
2. Tekan Buka, lalu Batal: status tetap Belum Dibuka. Buka lagi dan konfirmasi.
3. Melalui Profil, ganti peran menjadi Praktikan Alya.
4. Buka sesi yang sama: status Dibuka. Presensi lewat konfirmasi, cek feedback/waktu.
5. Kembali ke detail: tombol Sudah Presensi nonaktif; cek waktu sama di Riwayat.
6. Ganti kembali ke Dimas. Cek Rekap/detail: Alya Hadir, Bima belum hadir.
7. Coba filter Semua/Hadir/Belum Hadir, cek angka tetap sesuai daftar.
8. Tekan Tutup lalu Batal: sesi masih Dibuka. Ulangi dan konfirmasi penutupan.
9. Ganti ke Alya: status Ditutup, record/waktu tetap tampil dan tombol nonaktif.
10. Ganti ke Bima: Tidak Hadir dan tidak bisa presensi baru pada sesi tersebut.
11. Kembali ke Dimas: sesi tidak dapat dibuka kembali.
12. Cek Sinta (tanpa penugasan), Raka (tanpa jadwal/riwayat), serta Nadia pada
    Jaringan Komputer (`sesi-05`, tanpa peserta).

Tes otomatis dan bundling tidak menggantikan uji interaksi di perangkat ini.
