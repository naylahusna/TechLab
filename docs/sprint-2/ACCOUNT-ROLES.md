# Satu akun mahasiswa, akses Praktikan dan Asprak

Owner: Nayla Husna — SRS-01, SRS-02, SRS-04, SRS-05 Sprint 2.

Sprint 1 menggunakan pemilihan peran dan identitas dummy untuk demonstrasi.
Sprint 2 mempertahankan tampilan sesuai peran, dengan satu akun Firebase Auth
dan satu UID untuk setiap mahasiswa. Pengguna tidak memilih identitas orang
lain. Ketika mahasiswa ditunjuk sebagai asprak, petugas memberikan izin
tambahan pada akun yang sudah ada. Nama tampilan peran ini adalah **Asprak**;
nilai kontrak kode tetap `asisten` agar terhubung dengan modul tim.

## Alur akun

1. Mahasiswa mendaftar menggunakan email, password, nama, dan NIM.
2. Akun baru mendapat akses Praktikan saja.
3. Petugas yang berwenang memeriksa identitas dan penunjukan asprak, lalu
   menambahkan izin Asprak pada **UID yang sama** melalui Firebase Console
   atau backend tepercaya. Pendaftaran publik dan edit profil tidak dapat
   memberikan izin ini. Tidak ada role `admin` di form aplikasi.
4. Setelah login, pemilik dua akses membuka Profil dan memilih mode Praktikan
   atau Asprak. Pergantian memerlukan konfirmasi; pembatalan mempertahankan
   mode. Simpan edit profil sebelum berganti mode.
5. Mode Praktikan menampilkan jadwal/riwayat kelas yang diikuti; mode Asprak
   menampilkan fungsi asisten dan kelas yang diampu. Penugasan kelas tetap
   mengikuti `studentIds` dan `assistantIds` pada modul SRS-06–12.
6. UID, profil, dan dokumen presensi tidak dipindahkan atau dibuat ulang.
   Riwayat praktikan tetap tersedia ketika kembali ke mode Praktikan.

## Kontrak profil dan kompatibilitas

Contoh bagian otorisasi dari `users/{uid}` untuk akun baru:

```json
{ "role": "praktikan", "roles": ["praktikan"] }
```

Setelah petugas memberikan akses asprak:

```json
{ "role": "praktikan", "roles": ["praktikan", "asisten"] }
```

- `roles` adalah daftar izin yang ditetapkan petugas, maksimal dua nilai unik.
- `role` adalah peran awal/field kompatibilitas. Nilainya harus termasuk dalam
  `roles`. Untuk akun mahasiswa dengan kedua akses, pertahankan `praktikan`.
- Mode aktif disimpan selama sesi aplikasi dan tidak ditulis ke Firestore.
  Setelah aplikasi dimuat ulang atau login ulang, mode kembali ke nilai `role`.
  Pemilihan mode mengubah tampilan; server memeriksa daftar izin dan hubungan
  kelas secara independen.
- Profil lama tanpa `roles` tetap memiliki tepat satu izin sesuai `role` lama.
  Tidak ada migrasi massal atau pemberian akses asprak otomatis.
- Jika akses asprak dicabut saat aplikasi terbuka, pembaruan profil menghapus
  pilihan tersebut dan mengembalikan mode ke Praktikan. Server menolak operasi
  asisten baru meskipun klien masih menampilkan data lama.
- Pengguna biasa hanya dapat mengubah `name`, `number`, dan `updatedAt`.
  Penambahan, pengubahan, atau penghapusan `role`/`roles` dari klien ditolak.

## Langkah petugas pada Firebase aktif

Gunakan proyek **`techlab-naylahusna-2026`**. Hak IAM Firebase/Google Cloud
terpisah dari izin aplikasi; memiliki akun TechLab sebagai asisten tidak
memberikan akses ke Console.

1. Integrasikan versi aplikasi dan rules yang mendukung `roles` ini. Petugas
   yang memiliki akses deploy menjalankan `npm run firebase:deploy` dari
   versi yang telah direview. Jangan menambahkan field baru sebelum rules
   tersebut aktif, karena rules lama akan menolak edit profil baru.
2. Mahasiswa mendaftar/login ke aplikasi Firebase aktif dengan
   `EXPO_PUBLIC_USE_FIREBASE_EMULATORS=false`. Pastikan email muncul di
   **Authentication → Users**. Salin UID akun yang memang ditunjuk.
3. Di **Firestore Database → users → UID yang sama**, periksa nama dan NIM.
   Jika profil belum ada, selesaikan profil melalui aplikasi terlebih dahulu.
   Jangan membuat akun kedua untuk orang yang sama.
4. Tambahkan field `roles` bertipe **array**, dengan dua elemen string:
   `praktikan` dan `asisten`. Pastikan `role` bertipe string bernilai
   `praktikan`. Pertahankan UID, NIM, dan `createdAt`; perbarui `updatedAt`
   dengan timestamp perubahan. Simpan melalui akses petugas di Console.
5. Registrasi dan penyimpanan profil menyinkronkan `userDirectory/{uid}`
   secara atomik untuk pencarian peserta SRS-07. Akun dengan akses Praktikan
   tetap memiliki `role: praktikan` di direktori pada kedua mode. Akun lama
   yang belum memiliki entri dapat menyimpannya dengan memperbarui profil.
   Nama/NIM direktori wajib sesuai profil; rules hanya mengizinkan penyalinan
   field tersebut, tanpa perubahan izin atau penambahan data pribadi lain.
6. Pengguna membuka Profil: kedua mode harus tersedia. Asprak mengelola kelas
   melalui fitur kelas yang ada. Akses asprak tidak otomatis menjadikannya
   pengampu seluruh kelas.

Untuk mencabut akses asprak, petugas menetapkan `role: praktikan` dan
`roles: [praktikan]`. Catatan presensi dan keanggotaan kelas tidak dihapus;
penugasan kelas yang berakhir ditangani lewat pengelolaan kelas.

`asisten.demo@techlab.test` pada script seed hanya untuk **emulator**. Script
seed menolak berjalan tanpa Auth dan Firestore Emulator. Perubahan emulator
tidak membuat akun atau mengubah izin di Firebase aktif.

## Matriks akses

| Operasi | Praktikan | Akun dengan akses Asprak | Petugas proyek |
| --- | --- | --- | --- |
| Melihat/mengedit profil sendiri yang diizinkan | Ya | Ya | Melalui akses pengelolaan yang ditetapkan |
| Melihat jadwal dan presensi sebagai peserta | Sesuai keanggotaan | Dalam mode Praktikan, sesuai keanggotaan | Tidak melalui akun app petugas |
| Mengelola kelas/sesi dan melihat rekap | Tidak | Dalam mode Asprak, sesuai izin/penugasan modul | Tidak otomatis dari IAM |
| Memberikan/mencabut akses Asprak | Tidak | Tidak | Ya, melalui Console/backend tepercaya |
| Membaca profil pribadi akun lain dari aplikasi | Tidak | Tidak | Hanya melalui akses pengelolaan yang ditetapkan |

## Verifikasi dan penerapan

Integrasi dengan PR #35 mempertahankan UI `SelectionLayout` dan komponen
bersama Arga. Alur izin memakai mode aktif di UI dan daftar izin tepercaya
untuk pemeriksaan server. Pilihan mode tidak memindahkan data akun.
Pembaruan SRS-13–17 dari `main` juga dipertahankan. Perantara AI memeriksa
izin Praktikan pada profil tepercaya, termasuk akun dengan dua akses;
klasifikasi tetap memerlukan kepemilikan pengajuan dan persetujuan pemohon.
Daftar kelas difilter menurut penugasan mengajar atau keanggotaan peserta,
sehingga kedua mode tidak mencampur kelas yang diampu dan kelas yang diikuti.

- `npm test`: pilihan mode hanya menerima izin yang diberikan, UID tidak
  berubah, pembaruan profil mempertahankan pilihan, pencabutan membatalkan
  mode Asprak, dan akun lain tidak mewarisi pilihan pengguna sebelumnya.
- `npm run test:firebase`: registrasi/login/profil melalui Auth Emulator;
  rules menolak pemberian izin sendiri, melindungi kedua field peran, menguji
  asprak dapat menjalankan fungsi asisten sekaligus tetap presensi di kelas
  yang diikuti, serta memastikan catatan lama bertahan setelah pencabutan.
- Cek manual: batalkan/konfirmasi pergantian mode, periksa menu kedua peran,
  reload/login ulang, dan cabut izin ketika mode Asprak aktif.

Pengujian lokal tidak menetapkan role akun Firebase aktif. Status penerapan
cloud dan penunjukan akun nyata harus diverifikasi petugas sesudah deploy.

Catatan review Security Rules:

> I've set up prototype Security Rules to keep the data in Firestore safe.
> They are designed to be secure for operator-assigned role grants, immutable
> authorization fields, and class-scoped access. However, you should review and
> verify them before broadly sharing your app. If you'd like, I can help you
> harden these rules.

Referensi: [Firebase role-based access](https://firebase.google.com/docs/firestore/solutions/role-based-access)
dan [pembatasan field Firestore](https://firebase.google.com/docs/firestore/security/rules-fields).
