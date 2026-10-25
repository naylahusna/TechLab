# Fitur Practitioner (Praktikan)

Owner: Muhammad Zaidaan Ardiyansyah.

Modul UI untuk porsi SRS praktikan. Layar menerima view model yang sudah siap
tampil; wiring route dan pemanggilan state bersama dilakukan di PR integrasi.

## Cakupan SRS

| SRS    | Implementasi                                                      |
| ------ | ----------------------------------------------------------------- |
| SRS-05 | `JadwalScreen`                                                    |
| SRS-07 | `SessionDetailScreen`                                             |
| SRS-12 | Alur tombol presensi + pemanggilan `onConfirmAttendance`          |
| SRS-13 | `ConfirmAttendanceSheet`                                          |
| SRS-14 | `FeedbackBanner` sukses + status dan waktu hadir langsung berubah |
| SRS-16 | `getAttendanceAction`                                             |
| SRS-20 | `RiwayatScreen`                                                   |
| SRS-23 | `EmptyState` pada jadwal dan riwayat                              |

SRS-15 dan SRS-25 tetap milik Arga. Layar ini hanya menonaktifkan tombol dan
menampilkan alasan; validasi akhir wajib dilakukan store.

## Struktur

```text
src/features/practitioner/
  components/       komponen presentasional
  lib/              aturan tombol, label status, mapper, dan sorting
  screens/          layar praktikan
  theme.ts          alias semantik token dari src/theme
  types.ts          view model / kontrak props
  index.ts          public API modul
```

## Kontrak data

- Semua label tanggal dan waktu (`dateLabel`, `timeRangeLabel`,
  `attendedAtLabel`, `attendedAtDateLabel`) sudah berupa string siap tampil.
  Mapper/store yang memformat.
- `onConfirmAttendance` mengembalikan:
  - `{ ok: true }`
  - `{ ok: false, reason: string }`
- Waktu dan tanggal hadir tidak dikirim oleh aksi. Layar membaca
  `attendedAtLabel` dan `attendedAtDateLabel` dari record store pada render
  berikutnya agar sama dengan rekap asisten.
- `SessionDetail.myAttendance.status` mengikuti aturan:
  - `belum-presensi` selama sesi belum ditutup dan belum ada catatan.
  - `hadir` jika ada catatan, termasuk setelah sesi ditutup.
  - `tidak-hadir` setelah sesi ditutup tanpa catatan.
- Komponen presentasional tidak mengimpor `src/core`; mapper dan route yang
  menghubungkan data store ke view model.

## Integrasi route

Route hanya menjadi pembungkus tipis. Gunakan `useDemo` dan selector dari
`src/core`, lalu map hasilnya ke view model fitur:

```tsx
const demo = useDemo();
const sessions = selectMySessions(demo).map(toSessionListItem);

return <JadwalScreen sessions={sessions} onOpenSession={(id) => router.push(`/sesi/${id}`)} />;
```

Untuk detail sesi, panggil aksi store dari tombol konfirmasi:

```tsx
const result = demo.recordAttendance(session.id, demo.currentUser.id);
return result.ok ? { ok: true } : { ok: false, reason: result.message };
```

Wiring route ada di `src/app/(tabs)/jadwal.tsx`, `src/app/(tabs)/catatan.tsx`,
dan `src/app/sesi/[id].tsx`. Mapper core ke view model ada di
`lib/argamapping.ts`.

## Verifikasi

```bash
npx tsc --noEmit
npx expo lint
npm test
npx prettier@3 --check src/features/practitioner src/app
```
