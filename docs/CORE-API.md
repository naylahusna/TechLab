# Kontrak Core TechLab

Kontrak ini digunakan Zaidaan dan Fahri saat menghubungkan UI fitur mereka.
Fondasi ini menangani SRS-15, SRS-21, SRS-22, dan SRS-25. UI jadwal, detail,
modal presensi, feedback, riwayat, serta rekap tetap dikerjakan owner fitur.

Seri PR terpisah beserta base/urutan merge tersedia di `SRS-PR-ORDER.md`.
Kontrak lengkap ini tersedia setelah SRS-21 → SRS-22 → SRS-25 → SRS-15.

## Titik integrasi

Impor API dari `src/core/index.ts` memakai relative path sesuai lokasi screen:

```tsx
import {
  useDemo,
  selectMySessions,
  selectMySession,
  selectMyAttendance,
  selectSessionParticipants,
  selectAttendanceSummary,
  validateAttendance,
  validateSessionAction,
} from '../../core';
```

`useDemo()` mengembalikan snapshot `users`, `sessions`, `attendanceRecords`,
`currentUserId`, `currentRole`, `currentUser`, serta lima fungsi aksi di bawah.
Snapshot readonly dan data dibekukan; semua perubahan melalui fungsi aksi.

`RoleProvider` yang sudah terpasang di root adalah alias `DemoProvider`.
`useRole()` lama adalah alias `useDemo()`. Jangan memasang provider tambahan,
menyalin fixture, atau membuat state sesi/presensi di screen fitur.

## Field data

| Tipe               | Field                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `DemoUser`         | `id`, `name`, `role`, `number`, `group`, `initials`                                                               |
| `Session`          | `id`, `practicumName`, `meeting`, `className`, `lab`, `startsAt`, `endsAt`, `status`, `assistantId`, `studentIds` |
| `AttendanceRecord` | `id`, `sessionId`, `studentId`, `recordedAt`                                                                      |

`number` berisi NIM atau ID asisten. `studentIds` adalah daftar praktikan
terdaftar pada sesi; `assistantId` adalah asisten yang boleh mengelolanya.
Tanggal/waktu berupa string ISO 8601, bukan objek `Date`. UI boleh memformat
tampilan waktu, tetapi tidak mengubah string record yang sudah tersimpan.

Status sesi: `upcoming` → `open` → `closed`. Gunakan `sessionStatusLabels`
untuk teks Belum Dibuka/Dibuka/Ditutup. Jadwal dummy tidak mengubah status
otomatis berdasarkan tanggal atau waktu perangkat.

## Fungsi aksi

| Fungsi                                   | Return         | Perilaku                                                                                                |
| ---------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------- |
| `selectUser(userId, role?)`              | `boolean`      | Role boleh diambil dari identitas. Role eksplisit harus cocok; sesi/presensi tetap tersimpan.           |
| `openSession(sessionId)`                 | `ActionResult` | Hanya asisten penanggung jawab, dari `upcoming` ke `open`.                                              |
| `closeSession(sessionId)`                | `ActionResult` | Hanya asisten penanggung jawab, dari `open` ke `closed`. Record lama tetap tersedia.                    |
| `recordAttendance(sessionId, studentId)` | `ActionResult` | Praktikan aktif harus sama dengan `studentId`, terdaftar, sesi dibuka, dan belum presensi.              |
| `resetDemo()`                            | `ActionResult` | Memulihkan fixture awal sekaligus mengosongkan identitas aktif. Navigasi kembali ke pemilihan pengguna. |

`ActionResult` adalah `{ ok: true, message }` atau
`{ ok: false, code, message }`. Tampilkan `message` sebagai feedback pada UI.
Waktu kehadiran dibuat oleh store saat aksi dipanggil memakai waktu perangkat.
UI tidak mengirim timestamp atau menulis array record sendiri.

Contoh handler tombol konfirmasi presensi di screen praktikan:

```tsx
const demo = useDemo();
const availability = demo.currentUser
  ? validateAttendance(demo, sessionId, demo.currentUser.id)
  : null;

function confirmAttendance() {
  if (!demo.currentUser) return;
  const result = demo.recordAttendance(sessionId, demo.currentUser.id);
  // Hubungkan result.ok dan result.message ke feedback milik fitur.
  // Ambil waktu dari record terbaru lewat selectMyAttendance(demo) saat render.
}
```

Gunakan `availability?.ok` untuk tombol aktif/nonaktif, tetapi tetap periksa
hasil aksi setelah konfirmasi. Validasi saat render tidak menggantikan validasi
saat state diubah. Modal dibuka/dibatalkan tanpa memanggil fungsi aksi; panggil
aksi hanya dari tombol konfirmasi. Untuk buka/tutup sesi, gunakan pola yang
sama dengan `validateSessionAction(demo, sessionId, 'open' | 'close')`.

Semua fungsi aksi membaca state terbaru secara sinkron. Klik berturut-turut
dan callback dari render lama tetap divalidasi terhadap identitas/status terbaru.
Record diidentifikasi oleh pasangan sesi/praktikan dan tidak pernah ditimpa.

## Selector untuk UI

| Fungsi                                               | Hasil                                                                                   |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `selectMySessions(demo)`                             | Jadwal yang diikuti praktikan atau ditangani asisten aktif.                             |
| `selectMySession(demo, sessionId)`                   | Sesi yang terkait pengguna aktif, atau `null`.                                          |
| `selectMyAttendance(demo)`                           | Semua sesi praktikan aktif, termasuk yang belum/tidak hadir; asisten mendapat `[]`.     |
| `selectSessionParticipants(demo, sessionId)`         | Peserta untuk asisten penanggung jawab aktif; pengguna lain mendapat `[]`.              |
| `selectAttendanceSummary(demo, sessionId)`           | `{ total, present, notPresent }`; `null` jika tidak dapat diakses.                      |
| `selectAttendanceRecord(demo, sessionId, studentId)` | Lookup record tunggal atau `null`; untuk riwayat pribadi utamakan `selectMyAttendance`. |

Entri riwayat/peserta berisi `{ session, student, status, record }`.
Status `present` jika ada record, `pending` jika belum presensi dan sesi belum
ditutup, atau `absent` jika tanpa record setelah sesi ditutup. Gunakan
`attendanceStatusLabels` untuk Hadir/Belum Presensi/Tidak Hadir.

`notPresent` adalah jumlah peserta tanpa record, termasuk `absent` setelah
ditutup. Selalu berlaku `total === present + notPresent`. UI asisten boleh
memfilter hasil selector sendiri; filter tidak boleh mengubah state.
Selector yang mengembalikan `[]` tidak selalu berarti tidak memiliki akses;
gunakan `selectMySession` terlebih dahulu untuk membedakan sesi kosong.

## Error dan prioritas validasi

- Pilihan pengguna: `INVALID_USER`, `ROLE_MISMATCH` (aksi lama mengembalikan boolean).
- Umum: `USER_REQUIRED`, `SESSION_NOT_FOUND`.
- Pengelolaan sesi: `ASSISTANT_REQUIRED`, `NOT_ASSIGNED`, `INVALID_SESSION_TRANSITION`.
- Presensi: `STUDENT_REQUIRED`, `IDENTITY_MISMATCH`, `NOT_ENROLLED`,
  `ALREADY_PRESENT`, `SESSION_NOT_OPEN`.
- Internal: `INVALID_TIME`, `INVALID_ACTION`.

Jika praktikan sudah memiliki record, hasil tetap `ALREADY_PRESENT` meskipun
sesi kemudian ditutup. Sesi tersebut tetap berstatus `closed`; tombol presensi
nonaktif dan waktu record sebelumnya tetap ditampilkan. Praktikan tanpa record
pada sesi tertutup mendapat `SESSION_NOT_OPEN`.

## Skenario dummy

| ID        | Kondisi awal                                | Pengguna terkait     |
| --------- | ------------------------------------------- | -------------------- |
| `sesi-01` | `upcoming`, tanpa presensi; alur demo utama | Dimas; Alya dan Bima |
| `sesi-02` | `open`, Bima sudah hadir, Alya belum        | Dimas; Alya dan Bima |
| `sesi-03` | `closed`, Alya hadir, Bima tidak hadir      | Dimas; Alya dan Bima |
| `sesi-04` | `upcoming`, kelas lain                      | Nadia; Citra         |
| `sesi-05` | `open`, daftar peserta kosong               | Nadia                |

`praktikan-04` (Raka) dan `asisten-03` (Sinta) tidak memiliki jadwal untuk
demo empty state. Lima ID pengguna sebelumnya tetap tersedia. Reset memulihkan
dua record contoh; bukan mengosongkan seluruh record fixture.

## Pembagian perubahan

Arga memiliki `src/core/` dan wiring root. Zaidaan bekerja di
`src/features/practitioner/`, Fahri di `src/features/assistant/`. Ekspor screen
dari folder fitur; route bersama dihubungkan lewat PR integrasi. Perubahan
field/fungsi kontrak perlu dikoordinasikan sebelum caller diubah.

Jalankan `npm test`, `npx expo lint`, dan `npx tsc --noEmit` sebelum integrasi.
Alur state lintas peran sudah diuji otomatis; demonstrasi visual lengkap
menunggu UI kedua fitur terhubung.
