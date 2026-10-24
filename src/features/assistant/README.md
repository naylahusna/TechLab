# Assistant

Owner: Muhammad Fahri.

Berisi jadwal asisten, detail sesi, modal buka/tutup, rekap peserta, dan filter
status. Aksi sesi harus memanggil state bersama dari `src/core/`.

Integrasi shared state menggunakan UI di `screens/`:

- `screens/AssistantJadwalScreen.tsx`: jadwal dan pintu masuk detail sesi.
- `screens/AssistantRekapScreen.tsx`: rekap seluruh sesi yang ditugaskan.
- `screens/AssistantSessionDetailScreen.tsx`: modal buka/tutup, ringkasan, roster, dan filter.
- `lib/assistant-mapping.ts`: formatting data sesi dan peserta dari selector core.

Route tab jadwal dan catatan memilih layar asisten sesuai peran aktif. Keduanya
serta detail memakai snapshot `useDemo()` yang sama dengan praktikan. Gunakan ID
sesi dari `src/core/demo-data.ts` dan satu route `/sesi/[id]` untuk kedua peran.
Callback detail memanggil aksi buka/tutup pada store bersama; jangan membuat
state sesi terpisah atau membawa state dari PR lama.

Kontrak dan skenario uji manual ada di `docs/SRS-22.md`.
