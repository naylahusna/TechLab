# SRS-02 — Pemilihan identitas dummy

Branch: `feature/srs-02-pemilihan-identitas`.
Base: `feature/srs-01-pemilihan-peran`.

## Hasil

- Pilihan peran dilanjutkan ke daftar identitas yang sesuai.
- Tersedia tiga praktikan dan dua asisten fiktif di `src/core/users.ts`.
- Nama, NIM/ID, kelas/lab dan avatar inisial tampil di kartu pilihan.
- Tombol konfirmasi nonaktif sampai satu identitas dipilih.
- Role dan user ID dikonfirmasi sekaligus ke provider root; identitas yang
  tidak ditemukan atau tidak sesuai role ditolak.
- Pengantar menampilkan identitas yang dikonfirmasi. Buka halaman pengantar
  tanpa identitas akan mengembalikan pengguna ke pemilihan peran.
- Perubahan pilihan sementara dan tombol kembali tidak mengubah user aktif.

Expo Router dan dependensi standar Expo dipasang sebagai prasyarat perpindahan
halaman. `react-dom` mengikuti versi React untuk peer dependency Router;
tidak ada backend atau layanan eksternal. Entry `index.ts` dipertahankan dan
mendaftarkan `expo-router/entry`. Provider dipasang di `src/app/_layout.tsx`.
Seluruh state hanya bertahan selama aplikasi berjalan.

## Verifikasi

Jalankan `npm test`, `npx expo lint`, dan `npx tsc --noEmit`.
Bundle dapat diperiksa dengan `npx expo export --platform android`.

Hasil sebelum commit: dua pengujian state lulus, lint dan typecheck lulus,
serta bundle Android berhasil dibuat. Uji visual di perangkat belum dilakukan.

Cek manual di HP: pilih masing-masing peran; periksa daftar yang sesuai; pilih
kartu, lalu kartu lain; konfirmasi dan periksa identitas pada pengantar. Ulangi
dengan reload penuh untuk peran lain. Desain memakai header biru, kartu putih,
indikator radio, dan token warna yang konsisten dengan SRS-01.

SRS-03 menambahkan pergantian pengguna. SRS-04 melengkapi menu peran. Jadwal,
presensi dan rekap tetap menjadi pekerjaan owner fitur terkait.
