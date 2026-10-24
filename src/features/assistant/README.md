# Assistant

Owner: Muhammad Fahri.

Berisi jadwal asisten, detail sesi, modal buka/tutup, rekap peserta, dan filter
status. Aksi sesi harus memanggil state bersama dari `src/core/`.

Integrasi SRS-22 mengadaptasi UI dari branch Fahri
`feature/srs-24-Informasi-jadwal-rekap-kosong` (`1ae76dd`) ke core bersama:

- `AssistantScheduleScreen.tsx`: jadwal dan pintu masuk rekap dari sesi penugasan.
- `AssistantSessionDetailScreen.tsx`: modal buka/tutup, ringkasan, roster, dan filter.
- `session-view.ts`: view/formatting dari snapshot core; tidak menyimpan data baru.

`useDemo()` dan `useRole()` membaca provider yang sama. Gunakan ID sesi dari
`src/core/demo-data.ts` dan route `/sesi/[id]` untuk kedua peran. Jangan membawa
`assistant-sessions.ts`, `session-state.ts`, provider lama, atau route kedua
`[sessionId].tsx` saat menggabungkan penyesuaian UI dari branch lama.

Kontrak dan skenario uji manual ada di `docs/SRS-22.md`.
