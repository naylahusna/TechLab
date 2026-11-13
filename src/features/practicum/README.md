# Practicum — SRS-06–12

Modul data dan aturan untuk kelas, peserta, jadwal, sesi, presensi, dan rekap.
Owner: Zaidan Ardiyansyah.

## Cakupan

| SRS | Fitur | Status fondasi |
| --- | --- | --- |
| SRS-06 | Class Management | types, rules, indexes, repository, seed |
| SRS-07 | Participant Management | types, rules, repository, seed |
| SRS-08 | Schedule Management | types, rules, indexes, repository, seed |
| SRS-09 | Practicum Session Management | types, rules, repository, seed |
| SRS-10 | Practicum Attendance | types, rules, repository, seed |
| SRS-11 | Attendance Recapitulation | data presensi + izin (UI menyusul) |
| SRS-12 | Real-Time Attendance Synchronization | repository siap untuk listener (hook menyusul) |

Fondasi ini belum memasang UI. Layar asisten/praktikan akan memakai repository
ini pada tahap berikutnya.

## UI SRS-06

Route yang tersedia:

- `/kelas` — daftar kelas milik asisten.
- `/kelas/new` — form tambah kelas.
- `/kelas/[id]` — detail kelas + edit/arsip.
- `/kelas/[id]/edit` — form edit kelas.

Pintu masuknya adalah tombol **“Kelola Kelas”** di tab Jadwal asisten. Daftar
dimuat ulang saat layar kembali fokus. Detail kelas saat ini menampilkan
ringkasan, edit, dan arsip; bagian peserta/jadwal/sesi menyusul di SRS-07–09.
Real-time listener menyusul di SRS-12.

## Struktur koleksi

```text
classes/{classId}
  className, courseName, assistantIds, studentIds, memberIds,
  createdAt, updatedAt, archivedAt

participants/{classId_userId}
  classId, userId, studentNumber, joinedAt, leftAt

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
- Rekap membaca presensi per peserta (`getDoc`), bukan list query lintas-field,
  karena Firestore Rules membatasi field yang boleh dievaluasi pada list query.
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
- `permissions` masih ditutup sampai Arga menambahkan rules SRS-13–17.

## Seed

`seedPracticumData(db, { assistantId, studentIds })` tersedia untuk seed dari
client/test. Script emulator memakai data yang sama secara inline karena proses
rules-disabled berjalan di instance Firestore ESM.

Jalankan seed emulator:

```bash
npm run seed:emulator:exec
```

Script membuat akun demo di Auth emulator, dua kelas, tiga jadwal, sesi
`closed`/`open`/`scheduled`, dan dua presensi contoh, lalu mencetak kredensial:

- `asisten.demo@techlab.test` / `TechLab123!`
- `praktikan1.demo@techlab.test` / `TechLab123!`
- `praktikan2.demo@techlab.test` / `TechLab123!`
- `praktikan3.demo@techlab.test` / `TechLab123!`

Aktifkan `EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true` di `.env` sebelum membuka app.

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

## Batas dengan modul lain

- `users` milik auth Nayla; field yang dipakai: `uid`, `name`, `number`, `role`.
- `permissions` milik Arga; rekap SRS-11 akan membaca `sessionId`, `classId`,
  `userId`, `status`.
- Jangan membuat state praktikum paralel di `src/core`; gunakan repository ini.
