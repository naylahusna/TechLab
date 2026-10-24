# Kontrak Core TechLab

Owner core: Arga. Zaidaan dan Fahri menghubungkan screen dari folder fitur
masing-masing ke API ini; jangan menyalin fixture atau membuat provider baru.

## Snapshot dan pembacaan (SRS-22)

Impor `useDemo` dan selector dari `../../core` (sesuaikan relative path).
Hook mengembalikan `users`, `sessions`, `attendanceRecords`, `currentUserId`,
`currentRole`, `currentUser`, `selectUser(userId, role?)`, dan `resetDemo()`.

`selectUser` mengembalikan boolean agar screen SRS-02 tetap kompatibel.
Role yang dikirim harus sesuai identitas. `resetDemo` mengembalikan
`{ ok: true, message }`, memulihkan fixture dan mengosongkan identitas aktif.
Aksi selalu membaca snapshot terbaru; subscription React memperbarui screen.
`useRole()` dan `useDemo()` memakai provider yang sama di root.

| Tipe             | Field                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------- |
| DemoUser         | id, name, role, number, group, initials                                                       |
| Session          | id, practicumName, meeting, className, lab, startsAt, endsAt, status, assistantId, studentIds |
| AttendanceRecord | id, sessionId, studentId, recordedAt                                                          |

Semua data readonly. Tanggal/waktu berupa string ISO 8601. Status sesi adalah
`upcoming`, `open`, dan `closed`, dengan label tersedia di `sessionStatusLabels`.

| Selector                                           | Hasil                                               |
| -------------------------------------------------- | --------------------------------------------------- |
| selectMySessions(demo)                             | Jadwal terkait pengguna aktif                       |
| selectMySession(demo, sessionId)                   | Sesi terkait pengguna aktif atau null               |
| selectMyAttendance(demo)                           | Entri sesi/praktikan aktif; asisten mendapat []     |
| selectSessionParticipants(demo, sessionId)         | Entri peserta untuk asisten penanggung jawab        |
| selectAttendanceSummary(demo, sessionId)           | total, present, notPresent; null jika tidak terkait |
| selectAttendanceRecord(demo, sessionId, studentId) | Lookup record atau null                             |

Entri berbentuk `{ session, student, status, record }`. Status presensi
`present` jika memiliki record, `pending` jika belum tercatat dan belum
ditutup, `absent` jika tanpa record setelah ditutup. Gunakan
`attendanceStatusLabels`. Riwayat pribadi memakai `selectMyAttendance`.

## Validasi dan aksi sesi (SRS-25)

SRS-25 sudah menyediakan `openSession(sessionId)`, `closeSession(sessionId)`,
`validateSessionAction(demo, sessionId, 'open' | 'close')`, dan
`validateAttendance(demo, sessionId, studentId)`. Hasilnya
`{ ok: true, message }` atau `{ ok: false, code, message }`.
Penolakan tidak mengubah snapshot. UI memanggil aksi hanya saat konfirmasi,
bukan ketika membuka atau membatalkan modal.

Validasi saat render membantu kondisi tombol; aksi tetap memeriksa state
terbaru ketika dipanggil. Hanya asisten yang ditugaskan dapat membuka/menutup
sesi. Aksi transisi selalu upcoming → open → closed, tanpa buka ulang.

## Pencatatan presensi (SRS-15, tahap berikutnya)

SRS-15 menambahkan `recordAttendance` dengan penolakan duplikasi
secara atomik. Caller tidak menulis sesi/record langsung. UI modal,
feedback, dan daftar tetap dikerjakan owner fitur.

Skenario utama adalah `sesi-01` dengan Dimas/Alya/Bima. `sesi-02` sudah
dibuka dengan Bima hadir, `sesi-03` ditutup dengan Alya hadir. Raka dan
Sinta tanpa jadwal; `sesi-05` tanpa peserta.

Urutan PR dan base tersedia di `SRS-PR-ORDER.md`. Seluruh perubahan
bersifat lokal selama aplikasi berjalan; full reload memulihkan fixture.
