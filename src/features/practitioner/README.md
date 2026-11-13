# Practitioner

Modul `practitioner` mencakup pengalaman pengguna praktikan, mulai dari jadwal hingga riwayat kehadiran dan konfirmasi presensi.

## Kontribusi prototipe terdahulu

Fitur praktikan prototipe dikerjakan Muhammad Zaidaan Ardiyansyah (commit
`d5c8479`, `1a763e3`, dan `048f170`). Kontribusi historis ini berbeda dari
penugasan SRS aktif Sprint 1 di bawah.

## Fokus fitur

- `JadwalScreen` menampilkan sesi yang diikuti praktikan.
- `SessionDetailScreen` menampilkan detail sesi, status presensi, dan konfirmasi kehadiran.
- `RiwayatScreen` menampilkan catatan kehadiran pribadi.
- `FeedbackBanner` memberikan konfirmasi setelah presensi berhasil.

## Aturan utama

- Presensi hanya boleh dilakukan saat sesi dibuka dan praktikan belum hadir.
- Status kehadiran harus mengikuti aturan final dari `src/core`.
- Tombol presensi harus dinonaktifkan saat kondisi tidak memenuhi syarat.
- Data yang ditampilkan harus selalu berasal dari state bersama agar konsisten dengan asisten.

## Integrasi

Modul ini menggunakan selector dan aksi dari `src/core` untuk membangun view model. Layar tidak boleh menambah state paralel atau membangun logika rekam kehadiran yang berbeda dari reducer utama.

## Sprint 2

Modul ini berada dalam cakupan Praktikum & Presensi:

- SRS-06: Class Management
- SRS-07: Participant Management
- SRS-08: Schedule Management
- SRS-09: Practicum Session Management
- SRS-10: Practicum Attendance
- SRS-11: Attendance Recapitulation
- SRS-12: Real-Time Attendance Synchronization

Owner: Zaidan Ardiyansyah (Programmer 2). Spesifikasi rinci tersedia di
`docs/sprint-2/SRS-06.md` sampai `docs/sprint-2/SRS-12.md`.

## Sprint 1

Prototipe Sprint 1 berisi jadwal, detail sesi, presensi, feedback, riwayat,
dan kondisi kosong praktikan. Owner implementasi prototipe: Muhammad Zaidaan
Ardiyansyah, sebagaimana dicatat pada commit di bagian kontribusi di atas.

## Pembagian tugas

| Programmer | Owner | Tanggung jawab terkait folder ini |
|---|---|---|
| Programmer 2 | Zaidan Ardiyansyah | Owner SRS-06–12: praktikum dan presensi. |

## Catatan integrasi

- SRS-06–12 adalah kebutuhan Sprint 2; dokumen tidak menyatakan seluruhnya sudah diimplementasikan.
- Sinkronisasi kehadiran real-time harus menggunakan sumber data yang disepakati bersama.
- Integrasi autentikasi dan izin ke flow praktikan dilakukan bersama owner SRS terkait.
