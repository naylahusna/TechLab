# Fitur Praktikan (Zaidaan)

Modul UI untuk porsi SRS praktikan. Modul ini **belum terpasang ke route** karena
fondasi Expo Router dan store bersama masih menjadi tanggung jawab Arga.

## Cakupan SRS

| SRS | Implementasi |
|---|---|
| SRS-05 | `JadwalScreen` |
| SRS-07 | `SessionDetailScreen` |
| SRS-12 | Alur tombol presensi + pemanggilan `onConfirmAttendance` |
| SRS-13 | `ConfirmAttendanceSheet` |
| SRS-14 | `FeedbackBanner` sukses + status dan waktu hadir langsung berubah |
| SRS-16 | `getAttendanceAction` |
| SRS-20 | `RiwayatScreen` |
| SRS-23 | `EmptyState` pada jadwal dan riwayat |

SRS-15 dan SRS-25 tetap milik Arga. Layar ini hanya menonaktifkan tombol dan
menampilkan alasan; validasi akhir wajib dilakukan store.

## Struktur

```text
src/features/praktikan/
  components/       komponen presentasional
  lib/              aturan tombol dan label status
  screens/          layar praktikan
  fixtures.ts       data contoh sementara
  theme.ts          token sementara
  types.ts          view model / kontrak props
  index.ts          public API modul
```

## Cara memasang setelah fondasi siap

Route hanya menjadi pembungkus tipis. Contoh:

```tsx
// src/app/(praktikan)/jadwal.tsx
import { useRouter } from 'expo-router';
import { JadwalScreen } from '@/features/praktikan';
import { usePraktikanSessions } from '@/store/selectors'; // sesuaikan dengan API Arga

export default function JadwalRoute() {
  const router = useRouter();
  const sessions = usePraktikanSessions();

  return (
    <JadwalScreen
      sessions={sessions}
      onOpenSession={(id) => router.push(`/sesi/${id}`)}
    />
  );
}
```

```tsx
// src/app/(praktikan)/sesi/[id].tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SessionDetailScreen } from '@/features/praktikan';
import { useSessionDetail, useCurrentPraktikan } from '@/store/selectors';

export default function SesiRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const session = useSessionDetail(id);
  const praktikan = useCurrentPraktikan();

  return (
    <SessionDetailScreen
      session={session}
      praktikan={praktikan}
      onBack={() => router.back()}
      onConfirmAttendance={async () => {
        const result = await attendSession(id); // aksi milik Arga
        return result.ok
          ? { ok: true, attendedAtLabel: result.attendedAtLabel }
          : { ok: false, reason: result.reason };
      }}
    />
  );
}
```

## Kontrak yang perlu disepakati dengan Arga

- Semua label tanggal dan waktu (`dateLabel`, `timeLabel`, `attendedAtLabel`)
  sudah berupa string siap tampil. Mapper/store yang memformat.
- `onConfirmAttendance` mengembalikan:
  - `{ ok: true, attendedAtLabel: string }`
  - `{ ok: false, reason: string }`
- `SessionDetail.myAttendance.status` mengikuti aturan:
  - `belum-presensi` selama sesi belum ditutup dan belum ada catatan.
  - `hadir` jika ada catatan, termasuk setelah sesi ditutup.
  - `tidak-hadir` setelah sesi ditutup tanpa catatan.
- Jangan mengimpor `fixtures.ts` dari route produksi.

## Sementara

- `fixtures.ts` hanya untuk preview dan akan dihapus setelah store tersedia.
- `theme.ts` masih token lokal; pindahkan ke theme bersama agar konsisten
  dengan layar asisten.
- Belum ada route karena `src/app/` dan Expo Router belum ada di repo.

## Verifikasi

```bash
npx tsc --noEmit
```
