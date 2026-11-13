# Theme

Folder `src/theme` berisi token desain yang digunakan lintas aplikasi: warna, spacing, radius, typography, dan skema visual umum.

## Kontribusi prototipe terdahulu

Token tema dan penyegaran palet awal dikontribusikan Arga Yura Danendra pada
commit `57b56a8`. Karena tema dipakai lintas fitur, perubahan selanjutnya
dikoordinasikan dengan seluruh owner terkait.

## Tujuan

- Menjaga konsistensi tampilan di seluruh modul.
- Menyediakan satu sumber warna dan ukuran yang dapat dipakai berulang.
- Memudahkan perubahan visual secara terjadwal tanpa mengganti satu per satu komponen.

## Palet utama

- Biru utama: `#4268E8`
- Lime pastel: `#EAFCAD`
- Lavender: `#EEEAFF`
- Peach: `#FFE5D2`
- Off-white: `#F5F6F2`
- Charcoal: `#20251F`

## Ketentuan penggunaan

- Warna aktif dan badge menggunakan lime.
- Aksen kecil memakai warna pastel.
- Latar utama tetap berwarna putih atau off-white.
- `navy` tetap dipertahankan untuk menjaga konsistensi nama token dengan ekstensi layout yang sudah ada.
- Teks fitur harus menggunakan `Text` dari `src/components/Text.tsx` agar font Nunito konsisten.

## Font

Font Nunito dimuat melalui Expo Font SDK dan disimpan di `assets/fonts/` agar aplikasi tidak bergantung pada sumber eksternal saat runtime.

## Sprint 1

Token tema ini digunakan oleh prototipe Sprint 1.

## Sprint 2

Token tema digunakan lintas kebutuhan Sprint 2 SRS-00–17. Tidak ada SRS visual
khusus; perubahan token dikoordinasikan lintas owner.

## Pembagian tugas

| Programmer | Owner | Tanggung jawab terkait tema |
|---|---|---|
| Owner fitur terkait | Nayla Husna, Zaidan Ardiyansyah, atau Arga Yura Danendra | Perubahan token untuk fitur terkait; perubahan berdampak luas dikoordinasikan bersama. |

## Catatan integrasi

- Semua komponen harus menggunakan token yang ada di folder ini.
- Perubahan visual harus dipertimbangkan dampaknya terhadap seluruh modul.
- Font dan palet utama harus terjaga agar antarmuka tetap konsisten.
- `src/theme` adalah fondasi bersama; perubahan lintas fitur dikoordinasikan dengan seluruh owner terkait.
