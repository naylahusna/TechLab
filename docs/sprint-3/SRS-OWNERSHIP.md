# SRS Ownership — Sprint 3

Dokumen ini mencatat susunan tim dan owner `SRS-01` sampai `SRS-17` untuk Sprint 3 (*Location-Based Attendance, Maps, and Push Notification* + *Lab Admin Role* & *QR Attendance*). Nomor-nomor tersebut menggunakan penomoran khusus Sprint 3 dan memiliki arti berbeda dari SRS Sprint 1 (`../sprint-1/`) maupun Sprint 2 (`../sprint-2/`).

## Project Manager (PM)

- **Muhammad Zaidaan Ardiyansyah** — Koordinasi kontrak data Firestore lintas modul, review & merge Pull Request, serta pengujian integrasi 3 alur demonstrasi Sprint 3.

## Programmer 1 — Muhammad Fahri

**Bidang:** Laboratory Location, Location-Based Attendance & QR Attendance

- [SRS-01 — Laboratory Location and Radius Management](./SRS-01.md)
- [SRS-02 — Dedicated Attendance Page](./SRS-02.md)
- [SRS-03 — Device Geolocation and Location Permission Handling](./SRS-03.md)
- [SRS-04 — Attendance Radius Validation](./SRS-04.md)
- [SRS-05 — Location-Verified Attendance Recording](./SRS-05.md)
- [SRS-17 — QR Code Attendance Verification](./SRS-17.md) *(Tambahan opsional — dikerjakan setelah alur wajib `SRS-01`–`05` stabil)*

## Programmer 2 — Nayla Husna

**Bidang:** Interactive Laboratory Maps, Live Lab Activity & Lab Admin RBAC

- [SRS-06 — Interactive Laboratory Map Page](./SRS-06.md)
- [SRS-07 — Laboratory Markers and Detail Selection](./SRS-07.md)
- [SRS-08 — Live User Location Tracking on Map](./SRS-08.md)
- [SRS-09 — Laboratory Ongoing and Upcoming Activity Information](./SRS-09.md)
- [SRS-10 — Real-Time Map Activity Sync and Map Device Handling](./SRS-10.md)
- [SRS-16 — Lab Admin Role and Assistant Account Management](./SRS-16.md) *(Tambahan — dikerjakan setelah alur Maps `SRS-06`–`10` stabil)*

## Programmer 3 — Arga Yura Danendra

**Bidang:** Push Notification & Device Condition Handling

- [SRS-11 — Push Notification Foundation and Device Token Management](./SRS-11.md)
- [SRS-12 — Session Opened Push Notification](./SRS-12.md)
- [SRS-13 — Schedule Change Push Notification](./SRS-13.md)
- [SRS-14 — Permission Decision Push Notification](./SRS-14.md)
- [SRS-15 — Notification Permission, Delivery, and Error Handling](./SRS-15.md)

## Koordinasi

- Owner bertanggung jawab atas spesifikasi, implementasi, dan verifikasi SRS yang ditugaskan.
- Skema koleksi lokasi laboratorium (`labLocations/{locationId}` beserta `name`, `latitude`, `longitude`, dan `radiusMeters`) serta kaitannya dengan jadwal dan sesi disepakati di awal sprint agar modul Presensi (`SRS-01`–`05`) dan Maps (`SRS-06`–`10`) memakai sumber data yang sama.
- Validasi lokasi wajib menjadi bagian dari proses pencatatan presensi, bukan sekadar informasi visual di antarmuka.
- Security rules Cloud Firestore tetap menjadi lapisan otorisasi data untuk koleksi laboratorium, presensi, dan token perangkat notifikasi.
- Dokumen SRS menjelaskan target kebutuhan Sprint 3 dan tidak menyatakan implementasi sudah selesai.
