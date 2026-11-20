# Panduan Kontribusi Tim

## Sprint 1 — Prototipe presensi

### Struktur kerja

```text
src/
├── app/                  # route Expo Router saja
│   ├── (tabs)/           # navigasi utama
│   └── sesi/              # detail sesi dan rekap
├── core/                 # state, tipe, data dummy, aturan bisnis
├── components/           # komponen UI lintas fitur
├── features/
│   ├── auth/             # Arga: pilih peran dan identitas
│   ├── profile/          # Arga: ganti pengguna/reset demo
│   ├── navigation/       # Arga: tempat integrasi screen peran
│   ├── practitioner/     # Zaidaan: alur praktikan
│   └── assistant/        # Fahri: alur asisten
└── theme/                # token warna, spacing, typography
```

### Cara menghindari konflik

- Kerjakan hanya file pada folder ownership masing-masing.
- Jangan membuat salinan `sessions`, `attendanceRecords`, atau context sendiri.
- Integrasi melalui `useDemo()` dan selector dari `src/core/index.ts`.
  Kontrak API prototipe ada di `docs/CORE-API.md`; urutan PR prototipe ada di
  `docs/sprint-1/SRS-PR-ORDER.md`.
- Jika membutuhkan data baru, ajukan perubahan pada tipe/data di `src/core/`.
- Jika membutuhkan komponen umum, buat di branch sendiri lalu koordinasikan
  sebelum branch lain mengubah file yang sama.
- Route yang sama tidak boleh dikerjakan dua orang sekaligus. Pisahkan screen ke
  folder fitur dan lakukan wiring route dalam satu pull request integrasi.
- Setiap PR harus menyebutkan SRS yang selesai dan hasil lint/typecheck.

### Kerapian kode

- Konfigurasi format bersama ada di `.prettierrc.json`. Jalankan
  `npx prettier@3 --write src tests` untuk merapikan TypeScript dan TSX.
- Gunakan token warna dari `src/theme/tokens.ts` dan komponen `Text` bersama
  agar gaya tiap fitur tetap konsisten.
- `AGENTS.md`, `AGENTS.local.md`, dan `.codex/` adalah konfigurasi lokal yang
  diabaikan Git. Jangan menambahkannya menggunakan `git add -f`.
- Hasil build, cache, dan dependency sudah diabaikan lewat `.gitignore`.

### Urutan integrasi prototipe

1. Arga membuat tipe, data dummy, dan state bersama.
2. Zaidaan dan Fahri membangun UI fitur menggunakan kontrak state tersebut.
3. Arga melakukan wiring pemilihan pengguna dan navigasi.
4. Tim menjalankan demo lintas peran dari buka sesi sampai sesi ditutup.

### Pembagian SRS Sprint 1

Prototipe presensi Sprint 1 menggunakan SRS-01 sampai SRS-25. Pembagian owner
dan riwayat implementasi tercatat di bagian Sprint 1 pada
`docs/SRS-OWNERSHIP.md`. Dokumen dan panduan prototipe dipertahankan sebagai
catatan Sprint 1.

## Sprint 2 — SRS baru

### Pembagian programmer

- Programmer 1 — Nayla Husna
- Programmer 2 — Zaidan Ardiyansyah
- Programmer 3 — Arga Yura Danendra

Pembagian kebutuhan Sprint 2:

- Nayla Husna: Firebase Foundation & Authentication (SRS-00–05).
- Zaidan Ardiyansyah: Praktikum & Presensi (SRS-06–12).
- Arga Yura Danendra: Permission & AI Integration (SRS-13–17).

### Aturan kontribusi

- Gunakan spesifikasi dan nomor SRS pada `docs/sprint-2/`; penomorannya
  terpisah dari kebutuhan SRS-01–25 Sprint 1.
- Owner dan dependensi Sprint 2 dicatat di
  `docs/sprint-2/SRS-OWNERSHIP.md` dan `docs/sprint-2/SRS-PR-ORDER.md`.
- Setiap kontribusi Sprint 2 dilakukan pada branch terpisah dan pull request
  mencantumkan kebutuhan yang dikerjakan, pengujian, serta dampak integrasi.
- Perubahan lintas owner, kontrak data, atau akses Firebase dibahas bersama
  sebelum digabungkan.
- Jangan menandai kebutuhan selesai hanya karena dokumentasinya sudah dibuat;
  status harus didukung implementasi dan verifikasi.

## Sprint 3 — Location-Based Attendance, Maps, and Push Notification

### Susunan tim

- Project Manager (PM) — Muhammad Zaidaan Ardiyansyah
- Programmer 1 — Muhammad Fahri
- Programmer 2 — Nayla Husna
- Programmer 3 — Arga Yura Danendra

Pembagian kebutuhan Sprint 3:

- Muhammad Fahri: Laboratory Location & Location-Based Attendance (SRS-01–05).
- Nayla Husna: Interactive Laboratory Maps, Live Lab Activity & Lab Admin RBAC (SRS-06–10, SRS-16).
- Arga Yura Danendra: Push Notification & Device Condition Handling (SRS-11–15).

### Aturan kontribusi Sprint 3

- Gunakan spesifikasi dan nomor SRS pada `docs/sprint-3/`; penomorannya
  terpisah dari kebutuhan Sprint 1 dan Sprint 2.
- Owner dan aturan urutan kerja Sprint 3 dicatat di
  `docs/sprint-3/SRS-OWNERSHIP.md` dan `docs/sprint-3/SRS-PR-ORDER.md`.
- Fahri memprioritaskan PR `SRS-01` (koleksi lokasi & radius laboratorium di
  Cloud Firestore) agar segera masuk ke `main` untuk dipakai bersama modul Maps
  Nayla (`SRS-06`–`10`). Arga (`SRS-11`–`15`) dapat langsung mulai secara paralel.
- Setiap kontribusi Sprint 3 dilakukan pada branch terpisah dan pull request
  mencantumkan kode SRS Sprint 3 yang dikerjakan, hasil pengujian, serta dampak
  integrasi.
- Validasi lokasi wajib menjadi bagian dari pencatatan presensi di Firestore,
  dan seluruh fitur harus terintegrasi dengan data konsisten dari Sprint 2.
