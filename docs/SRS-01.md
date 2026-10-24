# SRS-01 — Pemilihan peran

Catatan integrasi SRS-02: file entry sekarang memakai Expo Router. UI bersama
dipindahkan ke `SelectionLayout`; Lanjutkan menuju daftar identitas, menggantikan
panel konfirmasi sementara pada implementasi awal. Dokumentasi di bawah
mencatat kondisi branch SRS-01 sebelum integrasi tersebut.

Pengguna memilih Praktikan atau Asisten agar mendapatkan tampilan yang sesuai.

## Implementasi

- `App.tsx` memasang `RoleProvider` dan layar pemilihan peran.
- `src/core/roles.ts` mendefinisikan nilai role yang valid.
- `src/core/role-context.tsx` menyimpan `currentRole` selama aplikasi berjalan.
- `src/features/auth/RoleSelectionScreen.tsx` mengelola pilihan sementara dan UI.
- `src/features/auth/RoleIcon.tsx` membuat ikon native tanpa library tambahan.

Kartu hanya mengubah pilihan sementara. Tombol Lanjutkan mengonfirmasi pilihan
ke context dan menampilkan pengantar yang sesuai peran. Belum ada perpindahan
route; konfigurasi Expo Router dilakukan pada SRS-04. Provider nantinya dapat
dipindahkan ke root layout agar tetap terpasang di atas semua route.

HTML Canva menjadi acuan komposisi dan warna. Teks ekspor yang kosong diisi dengan
copy TechLab. Script Canva, CDN, font remote, dan SDK telemetry tidak digunakan.

## Cek penerimaan manual

1. Buka aplikasi: dua kartu belum dipilih; Lanjutkan nonaktif.
2. Ketuk Praktikan: hanya kartu Praktikan aktif; Lanjutkan aktif.
3. Ketuk Asisten sebelum melanjutkan: hanya kartu Asisten aktif.
4. Ketuk Lanjutkan: tampil pengantar Asisten dan konfirmasi peran.
5. Reload, pilih Praktikan lalu Lanjutkan: tampil pengantar Praktikan.
6. Periksa layar sempit dan ukuran teks besar: halaman dapat digulir, teks dan
   kontrol tetap dapat dijangkau.

SRS-02 (identitas), SRS-03 (ganti pengguna), SRS-04 (navigasi peran), jadwal,
pengelolaan sesi, dan presensi belum diimplementasikan di pekerjaan ini.

## Hasil validasi

- `npx expo lint`: lulus.
- `npx tsc --noEmit`: lulus.
- `npx expo export --platform android --output-dir dist/srs01`: lulus;
  bundle Android berhasil dibuat. Folder `dist/` diabaikan Git.
- Pemeriksaan visual dan interaksi di perangkat/emulator belum dijalankan.

Untuk mencoba: jalankan `npm start`, lalu buka aplikasi menggunakan lingkungan
Expo yang mendukung SDK 58 dan ikuti cek penerimaan manual di atas.
