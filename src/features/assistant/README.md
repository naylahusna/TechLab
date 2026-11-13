# Assistant

Modul `assistant` berisi flow utama untuk asisten: jadwal, detail sesi, pembukaan dan penutupan sesi, rekap absensi, serta filter status peserta.

## Kontribusi prototipe terdahulu

UI jadwal dan pengelolaan sesi asisten prototipe dikerjakan Muhammad Fahri
(commit `8a801d8`, `38a7b64`, dan `1ae76dd`). Kontribusi historis ini berbeda
dari penugasan SRS aktif Sprint 1.

## Fokus fitur

- `JadwalScreen` menampilkan sesi yang ditangani asisten.
- `SessionDetailScreen` menampilkan ringkasan, peserta, dan opsi pengelolaan sesi.
- `RekapScreen` menampilkan status hadir dan belum hadir.
- `Filter` membatasi daftar peserta tanpa mengubah data asli.

## Prinsip integrasi

- Semua aksi sesi harus memanggil state bersama di `src/core`.
- Gunakan `useDemo()` untuk membaca data dan memanggil pembukaan/penutupan sesi.
- Hindari state lokal yang duplikat untuk sesi yang sama.
- Detail sesi untuk asisten dan praktikan harus menggunakan route yang sama agar data tetap konsisten.

## Sprint 2

Modul ini berada dalam cakupan Praktikum & Presensi SRS-06–12. Owner:
Zaidan Ardiyansyah (Programmer 2). Spesifikasi rinci tersedia di
`docs/sprint-2/SRS-06.md` sampai `docs/sprint-2/SRS-12.md`.

## Sprint 1

Prototipe Sprint 1 mencakup jadwal, detail sesi, pengelolaan sesi, rekap, dan
filter untuk asisten. Kontribusi implementasi awal Muhammad Fahri tercatat
pada commit di atas.

## Pembagian tugas

| Programmer | Owner | Tanggung jawab terkait folder ini |
|---|---|---|
| Programmer 2 | Zaidan Ardiyansyah | Owner SRS-06–12: praktikum dan presensi. |

## Catatan integrasi

- SRS-06–12 adalah kebutuhan Sprint 2; dokumen tidak menyatakan seluruhnya sudah diimplementasikan.
- Pertahankan perilaku prototipe sampai pengganti terintegrasi dan tervalidasi.
- Integrasi autentikasi dan permission dilakukan bersama owner SRS terkait bila diperlukan.
