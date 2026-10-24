# Theme

Token visual bersama seperti warna, spacing, radius, dan typography diletakkan di
sini. Perubahan token perlu diinformasikan ke semua owner fitur karena dapat
mengubah tampilan lintas halaman.

Palet TechLab mengikuti referensi startup minimalis: biru `#4268E8`, lime pastel
`#EAFCAD`, lavender `#EEEAFF`, peach `#FFE5D2`, latar off-white `#F5F6F2`, dan
teks charcoal `#20251F`. Gunakan lime untuk pilihan aktif dan badge, warna pastel
untuk aksen kecil, serta permukaan putih untuk konten utama. Token `navy`
tetap digunakan untuk teks charcoal agar komponen memakai nama yang konsisten.

Gunakan `Text` dari `src/components/Text.tsx` untuk teks fitur agar font Nunito
dan pembesaran teks bawaan tetap konsisten. Bobot 400, 600, 700, dan 800 dimuat
sekali di root melalui Expo Font SDK 58 dengan definisi di `fonts.ts`.
File TTF tersimpan di `assets/fonts/`,
jadi aplikasi tidak mengambil font dari internet saat dijalankan. Lisensi SIL
Open Font License ikut disimpan di folder tersebut. Font bersumber dari
https://github.com/expo/google-fonts/tree/master/font-packages/nunito.
