# SRS-04 — Navigasi sesuai peran

Branch: `feature/srs-04-navigasi-peran`.
Base: `feature/srs-03-pergantian-pengguna`.

## Hasil

- Setelah memilih identitas, pengguna masuk ke tab jadwal.
- Praktikan: Jadwal, Riwayat, Profil.
- Asisten: Sesi Saya, Rekap, Profil.
- Header, sapaan, nama, role, identitas dan penjelasan halaman mengikuti user aktif.
- Tab aktif ditandai biru. Shortcut antarhalaman dan avatar profil dapat ditekan.
- Provider identitas tetap dipasang pada root; navigator tab diperbarui saat user
  berubah sehingga menu tidak tertinggal pada role lama.
- Halaman tab tanpa identitas dan tautan yang tidak dikenal mengarahkan ke alur
  pemilihan. Halaman pemilihan biasa tidak membuka kembali onboarding untuk user
  aktif; pergantian harus melalui mode switch dan konfirmasi.

Halaman Jadwal dan Catatan adalah tempat integrasi UI milik Zaidaan/Fahri,
dengan konten pengantar/empty state sementara. Tidak ada implementasi sesi,
presensi, riwayat aktual, atau rekap aktual dalam SRS-02–04 ini.

## Struktur integrasi

Route di `src/app/(tabs)/` tetap tipis. Owner fitur cukup mengganti isi route
jadwal/catatan dengan screen dari folder fiturnya. Layout tab, profil, provider,
dan proses pemilihan pengguna tetap dikelola Arga. Jangan membuat route profil
kedua di luar `(tabs)` karena public path-nya sama.

`navigationFor` menyimpan penamaan menu peran. `useRole()` menyediakan user aktif
dan `selectUser(userId, role)`. Identitas hanya berubah setelah konfirmasi;
provider harus tetap di atas navigator saat SRS-22 ditambahkan.

## Cek manual

1. Pilih Praktikan dan Alya: masuk ke Jadwal dan periksa identitas di header.
2. Pindah ke Riwayat lalu Profil lewat tab; coba shortcut dan avatar header.
3. Ganti identitas ke Bima: periksa user pada semua halaman.
4. Ganti peran ke Asisten dan pilih Dimas: menu menjadi Sesi Saya/Rekap/Profil.
5. Buka Rekap lalu ganti kembali ke Praktikan: label kembali Riwayat.
6. Batalkan pergantian dari halaman atau modal: identitas/menu tetap sama.
7. Reload penuh: kembali memilih peran. Tidak ada penyimpanan permanen.

Uji otomatis dijalankan dengan `npm test`; lint/typecheck dan export memeriksa
integrasi semua route. Uji visual/interaksi di perangkat tetap perlu dilakukan.

Hasil sebelum commit: empat pengujian lulus; lint, TypeScript dan pemeriksaan
versi dependensi lulus; bundle Android dan iOS berhasil diekspor.

Karena entry sudah menggunakan Router, hentikan server lama lalu jalankan
`npx expo start --tunnel --clear` dan scan ulang QR untuk mencoba versi terbaru.

## Urutan branch

Branch SRS-02 dibuat dari SRS-01; SRS-03 dari SRS-02; SRS-04 dari SRS-03.
Untuk review per SRS, gunakan base branch sebelumnya. Merge ke main dilakukan
berurutan 01 → 02 → 03 → 04 ketika tim menyetujuinya.
