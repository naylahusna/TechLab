# SRS Ownership dan Batas Perubahan

Dokumen ini menjadi kontrak kerja tim agar implementasi SRS dapat dikerjakan paralel
tanpa saling menimpa file atau membuat state terpisah.

## Sprint 1 — Prototipe presensi

## Pembagian tanggung jawab

### Arga Yura Danendra — fondasi aplikasi dan state bersama

- SRS-01: pilih peran Praktikan/Asisten (`e2f5b5d`)
- SRS-02: pilih identitas dummy (`67e0733`)
- SRS-03: ganti peran atau identitas (`55b2880`)
- SRS-04: navigasi sesuai peran (`bf4ca2e`)
- SRS-15: mencegah presensi berulang (`90e21b4`)
- SRS-21: data dummy (`20ae371`)
- SRS-22: state sesi dan presensi konsisten (`35faf48`)
- SRS-25: validasi aturan perubahan state (`0f7cc40`)

Integrasi UI asisten dengan shared state juga dilakukan Arga (`e4e322c`).

Folder utama:

- `src/core/` — tipe, data dummy, store/context, dan aturan bisnis
- `src/features/auth/` — pemilihan peran/identitas
- `src/features/profile/` — ganti pengguna
- `src/app/_layout.tsx`, `src/app/index.tsx` — routing/root flow
- `src/app/(tabs)/` dan `src/features/navigation/` — menu dan tempat integrasi screen

### Muhammad Zaidaan Ardiyansyah — fitur praktikan

- SRS-05, SRS-07, SRS-12, SRS-13, SRS-14, SRS-16, SRS-20, SRS-23
- Riwayat implementasi fitur praktikan antara lain `d5c8479`, `1a763e3`,
  dan `048f170`.

Folder utama:

- `src/features/practitioner/`
- Ekspor screen dari folder fitur; route jadwal/catatan bersama dirangkai Arga.
- Detail praktikan nantinya dipasang pada route sesi melalui PR integrasi.

### Muhammad Fahri — fitur asisten

- SRS-06, SRS-08, SRS-09, SRS-10, SRS-11, SRS-17, SRS-18, SRS-19, SRS-24
- Riwayat implementasi fitur asisten antara lain `8a801d8`, `38a7b64`,
  dan `1ae76dd`.

Folder utama:

- `src/features/assistant/`
- Ekspor screen dari folder fitur; route jadwal/catatan bersama dirangkai Arga.
- Detail dan rekap asisten nantinya dipasang melalui PR integrasi.

## Aturan file bersama

1. Jangan membuat data sesi atau presensi kedua untuk fitur praktikan/asisten.
2. `src/core/` adalah satu-satunya sumber state sesi dan presensi.
3. Programmer fitur tidak mengubah reducer/store/core secara langsung tanpa
   menyepakati perubahan kontrak terlebih dahulu.
4. Komponen umum diletakkan di `src/components/`. Jika hanya dipakai satu fitur,
   letakkan komponen tersebut di folder fitur terkait.
5. Route hanya mengatur navigasi dan menyusun screen. Logika bisnis diletakkan di
   `src/core/` atau folder fitur, bukan ditulis ulang di route.
6. `index.ts` adalah entry point Expo Router. `src/app/_layout.tsx` memasang
   provider root. Jangan membuat entry point atau provider alternatif.
7. Root `RoleProvider` adalah alias provider demo bersama. `useRole()` lama dan
   `useDemo()` membaca instance yang sama. Jangan memasang provider baru di
   fitur/route. API data, aksi, dan selector tersedia di `src/core/index.ts`.

## Kontrak state minimum

Kontrak implementasi tersedia di `docs/CORE-API.md`.
Urutan branch/base PR ada di `docs/SRS-PR-ORDER.md`:

- `currentUserId`
- `currentRole`
- `users`
- `sessions`
- `attendanceRecords`
- `selectUser(userId, role?)` — boolean, kompatibel dengan SRS-02
- `openSession(sessionId)`
- `closeSession(sessionId)`
- `recordAttendance(sessionId, studentId)`
- `resetDemo()`

Semua aksi wajib memvalidasi aturan transisi sesi dan presensi. Fitur praktikan dan
asisten hanya membaca state dan memanggil aksi tersebut.

## Format branch dan commit

Gunakan branch fitur terpisah:

- `feature/arga-foundation`
- `feature/zaidaan-practitioner`
- `feature/fahri-assistant`

Contoh commit:

- `feat(core): add shared demo attendance state`
- `feat(practitioner): add attendance confirmation flow`
- `feat(assistant): add session recap filters`

Sebelum merge, jalankan:

```bash
npx expo lint
npx tsc --noEmit
```

## Sprint 2 — SRS baru

Pembagian berikut menggunakan penomoran terpisah dari kebutuhan prototipe
Sprint 1. Spesifikasi tiap kebutuhan berada di folder `docs/sprint-2/`.

### Programmer 1 — Nayla Husna: Firebase Foundation & Authentication

- SRS-00: Firebase Foundation
- SRS-01: User Registration
- SRS-02: User Login
- SRS-03: User Logout
- SRS-04: Role-Based Access Control
- SRS-05: User Profile Management

Spesifikasi: `docs/sprint-2/SRS-00.md` sampai `docs/sprint-2/SRS-05.md`.
README terkait: `src/features/auth/README.md` dan
`src/features/profile/README.md`.

### Programmer 2 — Zaidan Ardiyansyah: Praktikum & Presensi

- SRS-06: Class Management
- SRS-07: Participant Management
- SRS-08: Schedule Management
- SRS-09: Practicum Session Management
- SRS-10: Practicum Attendance
- SRS-11: Attendance Recapitulation
- SRS-12: Real-Time Attendance Synchronization

Spesifikasi: `docs/sprint-2/SRS-06.md` sampai `docs/sprint-2/SRS-12.md`.
README terkait: `src/features/practitioner/README.md` dan
`src/features/assistant/README.md`.

### Programmer 3 — Arga Yura Danendra: Permission & AI Integration

- SRS-13: Permission Submission
- SRS-14: AI-Based Permission Classification
- SRS-15: Permission Management
- SRS-16: Permission Approval and Rejection
- SRS-17: Permission Status Monitoring

Spesifikasi: `docs/sprint-2/SRS-13.md` sampai `docs/sprint-2/SRS-17.md`.
Modul permission tersedia di `src/features/permission/`; integrasinya
dikoordinasikan dengan owner autentikasi dan praktikum/presensi.

## Catatan versi SRS

Dokumen SRS-01–25 di `docs/sprint-1/` mencatat kebutuhan prototipe presensi
Sprint 1. SRS-00–17 di `docs/sprint-2/` adalah kebutuhan baru Sprint 2 dengan
arti nomor yang berbeda.

Owner Sprint 1 di atas mengacu pada dokumen pembagian tanggung jawab dan
riwayat commit implementasi. Commit menunjukkan kontribusi prototipe, sedangkan
pembagian Sprint 2 mengikuti owner yang ditetapkan pada bagian Sprint 2.
