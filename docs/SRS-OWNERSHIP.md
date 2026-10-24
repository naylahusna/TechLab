# SRS Ownership dan Batas Perubahan

Dokumen ini menjadi kontrak kerja tim agar implementasi SRS dapat dikerjakan paralel
tanpa saling menimpa file atau membuat state terpisah.

## Pembagian tanggung jawab

### Arga Yura Danendra — fondasi aplikasi dan state bersama

- SRS-01: pilih peran Praktikan/Asisten
- SRS-02: pilih identitas dummy
- SRS-03: ganti peran atau identitas
- SRS-04: navigasi sesuai peran
- SRS-15: mencegah presensi berulang
- SRS-21: data dummy
- SRS-22: state sesi dan presensi konsisten
- SRS-25: validasi aturan perubahan state

Folder utama:

- `src/core/` — tipe, data dummy, store/context, dan aturan bisnis
- `src/features/auth/` — pemilihan peran/identitas
- `src/features/profile/` — ganti pengguna
- `src/app/_layout.tsx`, `src/app/index.tsx` — routing/root flow
- `src/app/(tabs)/` dan `src/features/navigation/` — menu dan tempat integrasi screen

### Muhammad Zaidaan Ardiyansyah — fitur praktikan

- SRS-05, SRS-07, SRS-12, SRS-13, SRS-14, SRS-16, SRS-20, SRS-23

Folder utama:

- `src/features/practitioner/`
- Ekspor screen dari folder fitur; route jadwal/catatan bersama dirangkai Arga.
- Detail praktikan nantinya dipasang pada route sesi melalui PR integrasi.

### Muhammad Fahri — fitur asisten

- SRS-06, SRS-08, SRS-09, SRS-10, SRS-11, SRS-17, SRS-18, SRS-19, SRS-24

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
