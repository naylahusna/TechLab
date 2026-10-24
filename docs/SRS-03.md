# SRS-03 — Pergantian pengguna

Branch: `feature/srs-03-pergantian-pengguna`.
Base: `feature/srs-02-pemilihan-identitas`.

## Hasil

- Pengantar menyediakan akses ke profil pengguna aktif.
- Profil menyediakan Ganti identitas dalam peran yang sama dan Ganti peran.
- Pemilihan sementara tetap lokal pada layar; provider tidak berubah sampai
  modal konfirmasi disetujui.
- Memilih identitas yang sedang digunakan ditandai Aktif dan tidak dapat
  dikonfirmasi ulang. Pembatalan pada layar, modal, atau tombol back tidak
  mengganti pengguna aktif.
- Sesudah konfirmasi, user ID dan role diperbarui bersamaan dan pengguna kembali
  ke pengantar. Semua halaman membaca identitas dari provider root yang sama.
- Provider tidak dipasang ulang saat berpindah halaman atau memilih pengguna.

Belum ada state sesi/presensi pada tahap ini; SRS-22 akan menambahkannya pada
provider root, bukan pada masing-masing pengguna atau screen.

## Verifikasi

`npm test` memeriksa pergantian identitas/peran, kembali ke pengguna sebelumnya,
ketidakvalidan identitas, serta pemilihan identitas yang sama.
Jalankan juga `npx expo lint`, `npx tsc --noEmit`, dan export Android.

Hasil sebelum commit: tiga pengujian state, lint, typecheck, dan export Android
lulus. Uji visual/interaksi pada HP belum dijalankan.

Cek manual: buka profil Alya, pilih Bima, batalkan modal lalu periksa profil
tetap Alya. Ulangi dan konfirmasi: profil menjadi Bima. Pilih Ganti peran,
pilih Asisten dan Dimas, lalu konfirmasi. Buka profil dan periksa role/ID.
Batalkan seluruh proses pemilihan dan pastikan user sebelumnya tetap aktif.
