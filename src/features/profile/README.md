# Profile

Modul `profile` menangani tampilan pengguna aktif, pergantian peran/identitas, serta reset data demo.

## Kontribusi prototipe terdahulu

Fitur profil dan pergantian pengguna prototipe dikerjakan Arga Yura Danendra
(`55b2880`). Kontribusi historis ini berbeda dari penugasan SRS aktif Sprint 1.

## Fokus

- Menampilkan identitas yang sedang aktif.
- Mengizinkan pergantian peran dan pengguna tanpa menghapus data sesi.
- Menyediakan reset demo untuk mengembalikan data ke kondisi awal.

## Integrasi

Modul ini berinteraksi langsung dengan API yang tersedia di `src/core`, terutama state demo dan helper identitas. UI di sini tidak membuat store baru; ia hanya memanggil aksi dan membaca state dari sumber utama.

## Sprint 2

SRS-05 — User Profile Management, dimiliki Nayla Husna sebagai bagian dari
Firebase Foundation & Authentication. Spesifikasi ada di
`docs/sprint-2/SRS-05.md`.

## Sprint 1

Prototipe Sprint 1 menyediakan profil pengguna aktif dan pergantian identitas
mengikuti SRS lama. Riwayat dan pembagian terdahulu dipertahankan sebagai
referensi implementasi.

## Pembagian tugas

| Programmer | Owner | Tanggung jawab terkait folder ini |
|---|---|---|
| Programmer 1 | Nayla Husna | Owner SRS-05: User Profile Management. |

## Catatan integrasi

- Profil harus membaca data aktif dari `src/core` dan tidak membuat state baru yang terpisah.
- Perubahan profil Sprint 2 harus mengikuti autentikasi dan aturan akses pada SRS-00–04 Sprint 2.
- Integrasi informasi izin dari SRS-17, bila diperlukan, dilakukan bersama owner permission.
- Implementasi prototipe Sprint 1 bukan bukti bahwa SRS-05 Sprint 2 sudah selesai.
