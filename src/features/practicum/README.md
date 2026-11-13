# Practicum — SRS-06–12

Modul data dan aturan untuk kelas, peserta, jadwal, sesi, presensi, dan rekap.
Owner: Zaidan Ardiyansyah.

## Cakupan

| SRS | Fitur | Status |
| --- | --- | --- |
| SRS-06 | Class Management | Selesai |
| SRS-07 | Participant Management | Selesai (userDirectory + studentName) |
| SRS-08 | Schedule Management | Selesai |
| SRS-09 | Practicum Session Management | Selesai |
| SRS-10 | Practicum Attendance | Selesai |
| SRS-11 | Attendance Recapitulation | Selesai (izin read-only) |
| SRS-12 | Real-Time Attendance Synchronization | Selesai (`onSnapshot`) |

## UI SRS-06–11

Route yang tersedia:

- `/kelas` — daftar kelas milik asisten.
- `/kelas/new` — form tambah kelas.
- `/kelas/[id]` — detail kelas + edit/arsip + pintu ke peserta/jadwal/sesi.
- `/kelas/[id]/edit` — form edit kelas.
- `/kelas/[id]/peserta` — daftar, cari, tambah, dan hapus peserta.
- `/kelas/[id]/jadwal` — daftar jadwal + buat sesi.
- `/kelas/[id]/jadwal/new` — form tambah jadwal.
- `/kelas/[id]/jadwal/[scheduleId]/edit` — form edit jadwal.
- `/kelas/[id]/sesi` — daftar sesi + buka/tutup/batal.
- `/sesi/[id]` — detail sesi asisten/praktikan.
- `/sesi/[id]/rekap` — rekap kehadiran asisten.

Pintu masuk kelas adalah tombol **“Kelola Kelas”** di tab Jadwal asisten.
Tab Jadwal, tab Rekap asisten, dan tab Riwayat praktikan sekarang membaca
Firestore.

Catatan UI:

- Form jadwal memakai input teks `YYYY-MM-DD` dan `HH:mm`; native date picker
  belum ditambahkan.
- Detail sesi memakai kembali layar Sprint 1 dengan adaptor Firestore.
- Rekap menampilkan hadir/izin/tidak hadir/izin menunggu/belum presensi.
- Izin yang disetujui dihitung sebagai `excused`, bukan `present`.
- Tab Rekap asisten memakai ringkasan presensi per sesi; tab Riwayat praktikan
  membaca presensi milik sendiri per sesi (`getDoc`) agar tetap sesuai rules.

## Struktur koleksi

```text
classes/{classId}
  className, courseName, assistantIds, studentIds, memberIds,
  createdAt, updatedAt, archivedAt

participants/{classId_userId}
  classId, userId, studentName, studentNumber, joinedAt, leftAt

userDirectory/{uid}
  uid, name, number, role, updatedAt

permissions/{permissionId}
  sessionId, classId, userId, reason,
  aiCategory, aiConfidence, aiStatus,
  status, decidedBy, decidedAt, createdAt, updatedAt

schedules/{scheduleId}
  classId, title, startAt, endAt, location, createdAt, updatedAt, archivedAt

sessions/{scheduleId}
  scheduleId, classId, studentIds, startAt, endAt, status,
  openedAt, closedAt, cancelledAt, createdBy, createdAt, updatedAt

attendances/{sessionId_userId}
  sessionId, classId, userId, status: "present", recordedAt
```

Keputusan Sprint 2:

- **Satu jadwal = satu sesi**, sehingga `sessionId` sama dengan `scheduleId`.
  Security Rules menegakkan `sessionId == scheduleId`.
- `classes.memberIds` adalah gabungan `assistantIds` + `studentIds`. Field ini
  dipakai untuk query/list yang aman di Firestore Rules.
- `sessions.studentIds` adalah snapshot peserta saat sesi dibuat, sehingga
  rekap historis tetap utuh meskipun peserta kemudian dihapus dari kelas.
- `attendances` hanya menyimpan kehadiran fisik (`present`). Status `excused`,
  `absent`, dan `pending` diturunkan saat rekap dari sesi + izin.
- Rekap memakai snapshot `sessions.studentIds`, lalu menggabungkan presensi dan
  izin. List presensi/izin dibatasi untuk asisten yang ditugaskan.
- `userDirectory` adalah direktori minimal untuk pencarian peserta; write
  dilakukan oleh seed/operator, bukan client.
- Hapus data memakai arsip (`archivedAt`) atau soft remove (`leftAt`), bukan
  hard delete, agar riwayat presensi/izin tidak hilang.
- Tanggal dan waktu memakai Firestore `Timestamp`.
- ID kelas/jadwal tidak boleh mengandung `_` karena `participantId` dan
  `attendanceId` memakai pemisah tersebut.

## Repository

```ts
import { createPracticumRepository } from '../../features/practicum';
import { getFirebaseFirestore } from '../../services/firebase/firestore';

const repo = createPracticumRepository(getFirebaseFirestore());

const classes = await repo.listClassesForAssistant(currentUser.uid);
const classId = await repo.createClass(
  { className: 'Informatika A', courseName: 'Pemrograman Perangkat Bergerak' },
  currentUser.uid,
);
const scheduleId = await repo.createSchedule({
  classId,
  title: 'Pertemuan 5',
  startAt: new Date('2026-11-16T08:00:00+07:00'),
  endAt: new Date('2026-11-16T10:00:00+07:00'),
  location: 'Lab Komputasi 1',
});
const sessionId = await repo.createSessionFromSchedule(scheduleId, currentUser.uid);
await repo.openSession(sessionId);
await repo.recordAttendance(sessionId, studentUid);
```

Semua method melempar `PracticumError` atau error Firestore. Gunakan
`practicumErrorMessage(error)` untuk pesan UI.

## Security Rules

Rules untuk `classes`, `participants`, `schedules`, `sessions`, dan
`attendances` ada di `firestore.rules`. Prinsipnya:

- Asisten hanya mengelola kelas yang `assistantIds`-nya memuat UID-nya.
- Praktikan hanya membaca kelas/jadwal/sesi tempat ia terdaftar.
- Presensi hanya boleh dibuat oleh pemilik UID, saat sesi `open`, terdaftar,
  dan belum punya record.
- `permissions` hanya read-only untuk rekap: asisten terkait boleh list/get,
  praktikan boleh get miliknya. Create/approve/reject tetap milik Arga.
- `userDirectory` read-only: asisten boleh mencari praktikan; write ditutup.

## Seed

`seedPracticumData(db, { assistantId, studentIds })` tersedia untuk seed dari
client/test. Script emulator memakai data yang sama secara inline karena proses
rules-disabled berjalan di instance Firestore ESM.

Jalankan seed emulator:

```bash
npm run seed:emulator:exec
```

Script membuat akun demo di Auth emulator, dua kelas, tiga jadwal, sesi
`closed`/`open`/`scheduled`, dua presensi contoh, `userDirectory`, dan tiga izin
(`approved`/`pending`/`rejected`), lalu mencetak kredensial:

- `asisten.demo@techlab.test` / `TechLab123!`
- `praktikan1.demo@techlab.test` / `TechLab123!`
- `praktikan2.demo@techlab.test` / `TechLab123!`
- `praktikan3.demo@techlab.test` / `TechLab123!`

Aktifkan `EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true` di `.env` sebelum membuka app.

## Real-time

Hook memakai `onSnapshot` untuk:

- daftar kelas asisten,
- overview tab Jadwal (kelas, jadwal, dan sesi per kelas),
- detail kelas,
- daftar jadwal/sesi/peserta,
- detail sesi (status sesi, presensi, izin),
- rekap kehadiran.

Listener dibersihkan saat layar unmount/logout. Untuk praktikan, detail sesi
mendengarkan dokumen presensi miliknya sendiri. Tab Rekap asisten dan Riwayat
praktikan memuat ulang data saat layar kembali fokus.

## Tes

```bash
npm test
npm run test:rules
npm run test:firebase
```

`test:rules` menjalankan tes Security Rules. `test:firebase` menjalankan tes
rules + integrasi Auth/Firestore/repository secara berurutan.

## Indexes

`firestore.indexes.json` memuat composite index untuk:

- `schedules`: `classId + startAt`
- `sessions`: `classId + startAt`
- `attendances`: `sessionId + classId`
- `permissions`: `sessionId + classId`
- `userDirectory`: `role + number`, `role + name`

## Batas dengan modul lain

- `users` milik auth Nayla; field yang dipakai: `uid`, `name`, `number`, `role`.
- `permissions` milik Arga; modul ini hanya membaca untuk rekap. Create,
  approve, reject, dan AI classification tetap milik SRS-13–17.
- `userDirectory` perlu sinkronisasi untuk user baru di production (Cloud
  Function/trigger); seed hanya untuk demo.
- Jangan membuat state praktikum paralel di `src/core`; gunakan repository ini.
