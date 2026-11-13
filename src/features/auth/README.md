# Auth

Modul `auth` menangani pemilihan peran dan identitas pengguna saat aplikasi dibuka.

## Kontribusi prototipe terdahulu

Pemilihan peran, identitas, dan integrasi navigasi prototipe dikerjakan Arga
Yura Danendra (commit `e2f5b5d`, `67e0733`, dan `bf4ca2e`). Kontribusi historis
ini berbeda dari penugasan SRS aktif Sprint 1 di bawah.

## Fokus

- Memilih peran aktif: praktikan atau asisten.
- Memilih identitas dummy yang tersedia di `src/core`.
- Menyampaikan state aktif ke seluruh aplikasi.

## Aturan

- Daftar peran dan user tidak boleh dibuat ulang di modul ini.
- Gunakan data yang sudah ada di `src/core/users.ts` dan hook yang tersedia.
- Setelah identitas dipilih, UI lain harus membaca data tersebut dari state bersama agar transisi antarperan tetap konsisten.

## Sprint 2

Firebase Foundation & Authentication:

- SRS-00: Firebase Foundation
- SRS-01: User Registration
- SRS-02: User Login
- SRS-03: User Logout
- SRS-04: Role-Based Access Control
- SRS-05: User Profile Management

## Sprint 1

Prototipe Sprint 1 menyediakan pemilihan peran dan identitas dummy. Kontribusi
implementasi historis tercatat di atas; SRS Sprint 1 lengkap ada pada
`docs/sprint-1/` dan tabel SRS-01–25 di root `README.md`.

## Pembagian tugas

| Programmer | Owner | Tanggung jawab terkait folder ini |
|---|---|---|
| Programmer 1 | Nayla Husna | Owner SRS-00–05 untuk modul autentikasi dan profil. |

## Catatan integrasi

- Dokumen SRS-00–05 di `docs/sprint-2/` menjelaskan target Sprint 2; tidak menyatakan Firebase sudah aktif atau implementasi telah selesai.
- Pertahankan alur prototipe yang ada sampai pengganti autentikasi berhasil diintegrasikan.
- Perubahan autentikasi dan role dikoordinasikan dengan owner fitur yang bergantung padanya.
