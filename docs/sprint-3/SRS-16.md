# SRS-16 — Pendaftaran Asprak dan Mode Aslab

**Sprint:** 3
**Owner:** Nayla Husna

## Alur Akun

- **Daftar Praktikan** membuat akun `praktikan` yang tetap berperan sebagai praktikan. Akun ini tidak masuk antrean Aslab.
- **Daftar sebagai Asprak** memerlukan akun dan email berbeda. Pemohon memasukkan nama dan NIM persis seperti akun praktikan asal. Akun baru berstatus `calon_asprak` dan hanya melihat status pengajuannya.
- Di **Kelola Pengguna**, Aslab dapat mencari nama atau NIM, meninjau pengajuan, dan menyetujui atau menolaknya. Sebelum menyetujui, Aslab memastikan pengajuan milik pemilik akun praktikan yang cocok. Pencocokan nama dan NIM membantu peninjauan identitas.
- Persetujuan mengubah akun kedua menjadi `asisten` dan mencatat UID akun praktikan yang cocok pada profil privat akun asprak. Penolakan menghasilkan `asprak_ditolak`. Pencabutan mengubah akun asprak menjadi `asprak_dicabut` sehingga akun itu kehilangan akses fitur. Akun praktikan asal tetap bisa digunakan.
- Role akun dan status pengajuan pada `users/{uid}` dan `userDirectory/{uid}` diperbarui dalam satu transaksi. Akun asprak yang sudah aktif sebelum perubahan ini bisa tetap masuk dan dapat dicabut oleh Aslab.

## Mode Aslab

- Akun `admin` masuk dalam **mode Aslab** dan punya menu **Kelola Pengguna**, **Lab**, **Maps**, dan **Profil**. Kelola master `labLocations` tersedia bagi Aslab.
- Tombol di **Profil** mengganti mode Aslab dan Asprak dalam sesi akun yang sama. Mode Asprak mengaktifkan menu pengelolaan kelas, penambahan dan pengeditan jadwal, buka/tutup sesi, rekap, dan tinjau izin. Akses terhadap kelas dan sesi tetap mengikuti penugasan pengguna.
- Mode hanya memengaruhi tampilan. Firestore mengecek role akun dari profil. Aslab dapat menjalankan fungsi asprak dengan UID yang sama dan hanya dapat memutuskan pengajuan untuk akun lain. Role Aslab ditetapkan melalui seed atau Firebase Console.

## Kriteria Penerimaan

1. Pendaftaran praktikan biasa tidak muncul sebagai pengajuan asprak. Akun praktikan tidak dapat dipromosikan langsung.
2. Pendaftaran asprak membuat akun menunggu. Aslab hanya bisa menyetujui jika nama dan NIM cocok dengan akun praktikan yang berbeda.
3. Persetujuan membuka fitur asprak pada akun kedua. Penolakan dan pencabutan menutup fitur asprak pada akun tersebut.
4. Profil Aslab dapat beralih mode tanpa login ulang. Mode Aslab menampilkan Kelola Pengguna, Lab, Maps, dan Profil. Mode Asprak dapat menjalankan tugas asprak sesuai penugasan.
5. Firestore menolak perubahan role oleh pengguna biasa, perubahan pada satu dokumen saja, dan pencabutan akses terhadap akun Aslab.
