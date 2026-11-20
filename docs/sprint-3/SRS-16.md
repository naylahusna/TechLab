# SRS-16 — Lab Admin Role and Assistant Account Management

**Sprint:** 3
**Owner:** Nayla Husna (Programmer 2 — Interactive Laboratory Maps, Live Lab Activity & Lab Admin RBAC)  
**Peran terkait:** Admin Lab / Koordinator (`admin`); Asisten Praktikum (`asisten`); Praktikan (`praktikan`); Firebase Authentication & Cloud Firestore Security Rules.

## Tujuan

Menambahkan peran khusus **Admin Lab (`admin`)** di atas asisten praktikum agar pengelolaan penetapan akun asisten (`praktikan` ↔ `asisten`) serta pemantauan master laboratorium dapat dilakukan langsung melalui aplikasi secara aman tanpa harus mengubah dokumen Cloud Firestore secara manual di Firebase Console.

## Kebutuhan

- Sistem autentikasi, navigasi, dan Firestore Security Rules mendukung 3 role: `praktikan`, `asisten`, dan `admin` (*Admin Lab*).
- Pendaftaran mandiri melalui halaman Register tetap selalu menghasilkan `role: 'praktikan'`; role `admin` ditetapkan melalui seed atau Firebase Console dan tidak dapat dipilih bebas dari form registrasi klien.
- Admin Lab memiliki layar khusus **Kelola Pengguna** untuk:
  - Melihat daftar akun terdaftar (`userDirectory` / `users`), mencari berdasarkan nama atau NIM/ID, dan memfilter berdasarkan role (`Semua`, `Asisten`, `Praktikan`).
  - Mempromosikan akun ber-role `praktikan` menjadi `asisten` serta menurunkan kembali akun `asisten` menjadi `praktikan` melalui modal konfirmasi.
  - Menyinkronkan perubahan role secara atomik pada dokumen `users/{uid}` dan `userDirectory/{uid}`.
- Admin Lab tidak dapat mencabut role `admin` milik akunnya sendiri guna mencegah *lockout*.
- Admin Lab dapat mengakses pengelolaan master lokasi & radius laboratorium (`SRS-01`), halaman Maps & aktivitas laboratorium (`SRS-06`–`10`), serta halaman Profil/Logout.
- Firestore Security Rules memastikan hanya akun terautentikasi ber-role `admin` (`isAdmin()`) yang diizinkan mengubah field `role` milik pengguna lain.

## Kriteria penerimaan

1. Login menggunakan akun `admin` menampilkan navigasi khusus Admin Lab (Kelola Pengguna, Lab, Maps, Profil).
2. Admin Lab dapat mencari akun praktikan terdaftar dan mengubah role-nya menjadi `asisten` (atau sebaliknya), dan perubahan tersebut tersimpan konsisten di `users/{uid}` dan `userDirectory/{uid}`.
3. Akun yang baru dipromosikan menjadi `asisten` langsung memperoleh akses fitur asisten setelah sesi/profil dimuat ulang.
4. Praktikan dan asisten biasa ditolak oleh Firestore Security Rules apabila mencoba mengubah role pengguna mana pun, dan Admin Lab tidak dapat menghapus role `admin` miliknya sendiri.

## Status

Dokumen ini mencatat kebutuhan tambahan Sprint 3; status implementasi harus diverifikasi terpisah.
