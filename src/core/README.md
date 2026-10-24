# Core

Folder ini adalah sumber tunggal state demo dan aturan bisnis aplikasi.

Tersedia untuk SRS-01–04, SRS-15, SRS-21, SRS-22, dan SRS-25:

- `index.ts`: API publik untuk integrasi fitur; ekspor hook, tipe, selector, dan aturan.
- `users.ts`: tujuh identitas fiktif; ID lama tetap tersedia.
- `types.ts`: kontrak readonly sesi, presensi, snapshot, dan hasil aksi.
- `demo-data.ts`: snapshot awal dengan lima sesi dan dua presensi contoh.
- `demo-state.ts`: transisi murni; aksi tidak valid mempertahankan state sebelumnya.
- `demo-store.ts`: satu instance per provider, aksi sinkron, dan subscription React.
- `demo-context.tsx`: provider root dan hook `useDemo()`.
- `role-context.tsx`: alias `RoleProvider`/`useRole()` ke provider/hook yang sama.
- `identity-state.ts`: helper perubahan identitas, tanpa state/provider lain.
- `action-result.ts`: hasil aksi konsisten untuk feedback dan penolakan.
- `rules.ts`: validasi aktor, penugasan, pendaftaran, status, dan presensi ganda.
- `selectors.ts`: pembacaan jadwal, presensi pribadi, peserta, dan jumlah kehadiran.
- `navigation.ts`: penamaan menu sesuai peran.

Kontrak field, contoh integrasi, prioritas error, serta skenario dummy tersedia
di `docs/CORE-API.md`. Jangan menyalin data atau memasang provider baru pada tab,
screen, maupun komponen pemilihan pengguna. Perubahan sesi/presensi hanya melalui
aksi dari `useDemo()`, bukan dengan memodifikasi array snapshot.

Hanya Arga yang menjadi owner utama folder ini. Programmer lain menggunakan API
yang tersedia, bukan membuat state paralel.
