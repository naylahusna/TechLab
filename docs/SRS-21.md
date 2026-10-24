# SRS-21 — Data Dummy

Branch: `feature/srs-21-data-dummy`.
Base PR: `fix/design-ui`.

Menambahkan tujuh identitas, lima sesi dengan status upcoming/open/closed,
peserta terdaftar, dan dua contoh presensi. ID pengguna lama tetap tersedia.
Ada pengguna tanpa jadwal dan sesi tanpa peserta untuk kebutuhan empty state.

`createInitialDemoState()` menghasilkan data baru yang dibekukan hingga array
peserta/record, sehingga fitur tidak dapat mengubah fixture secara langsung.
Tanggal tetap adalah informasi demo; status tidak berubah berdasarkan jam.

Branch ini menyiapkan tipe dan fixture saja. Provider SRS-01–04 tetap berjalan;
integrasi snapshot bersama ditambahkan pada SRS-22. UI teman tidak diubah.
Tes mencakup referensi user/sesi, tanggal, status, duplikasi seed, dan immutability.
Runner tes memilih file berdasarkan source branch aktif agar output kompilasi
branch lain yang masih ada di dist tidak ikut dijalankan.
Jalankan `npm test`, `npx expo lint`, dan `npx tsc --noEmit`.

Lihat `SRS-PR-ORDER.md` untuk urutan penggabungan.
