# Core

Folder `src/core` adalah lapisan domain aplikasi. Semua state demo, validasi, selector, dan aturan bisnis disimpan di sini agar fitur yang berbeda menggunakan satu sumber kebenaran yang sama.

## Kontribusi prototipe terdahulu

Fondasi demo lokal dan state bersama dikerjakan Arga Yura Danendra (commit
`20ae371`, `35faf48`, `0f7cc40`, dan `90e21b4`). Ini adalah riwayat prototipe,
bukan pemetaan nomor SRS aktif.

## Fokus utama

- `index.ts` — API publik untuk integrasi antar modul.
- `users.ts` — daftar identitas dummy yang digunakan saat memilih peran.
- `types.ts` — kontrak data sesi, presensi, snapshot, dan hasil aksi.
- `demo-data.ts` — dataset awal untuk jadwal, peserta, dan status sesi.
- `demo-state.ts` — reducer murni untuk transisi state.
- `demo-store.ts` — store yang menghubungkan aksi dan subscription React.
- `demo-context.tsx` — provider utama dan hook `useDemo()`.
- `role-context.tsx` — alias peran untuk provider identitas aktif.
- `identity-state.ts` — helper perubahan identitas tanpa state paralel.
- `action-result.ts` — format hasil aksi untuk feedback UI.
- `rules.ts` — validasi actor, status sesi, peserta, dan presensi ganda.
- `selectors.ts` — pengambil data untuk jadwal, rekap, dan riwayat.
- `navigation.ts` — label/menu sesuai role aktif.

## Aturan penggunaan

- Jangan membuat state lokal tambahan pada layar yang memerlukan data bersama.
- Gunakan aksi dari `useDemo()` untuk membuka sesi, menutup sesi, dan mencatat presensi.
- Hindari mutasi langsung terhadap snapshot data; semua perubahan harus melalui reducer.
- Validasi harus tetap mengikuti definisi di `rules.ts` agar tidak ada data yang berubah secara tidak sah.

## Tujuan

Folder ini menjadi fondasi untuk semua fitur praktikan, asisten, profil, dan autentikasi. Integrasi antar modul harus memanggil API yang sudah disediakan tanpa menambah state baru.

## Sprint 1

Folder ini menjadi sumber state demo, data dummy, selector, dan aturan bisnis
prototipe presensi. Kontributor historis core dicatat pada bagian di atas.

## Sprint 2

Core mendukung kontrak integrasi bersama untuk seluruh SRS Sprint 2:
SRS-00–05 (Nayla), SRS-06–12 (Zaidan), dan SRS-13–17 (Arga).

## Pembagian tugas

| Programmer | Owner | Tanggung jawab terkait folder ini |
|---|---|---|
| Programmer 1 | Nayla Husna | Kontrak autentikasi dan profil Sprint 2 (SRS-00–05). |
| Programmer 2 | Zaidan Ardiyansyah | Model kelas, jadwal, sesi, dan presensi Sprint 2 (SRS-06–12). |
| Programmer 3 | Arga Yura Danendra | Model pengajuan dan status izin Sprint 2 (SRS-13–17). |

## Catatan integrasi

- `src/core` menjadi sumber referensi utama untuk seluruh modul.
- Tidak boleh dibuat state paralel di fitur lain jika sudah ada API shared state.
- SRS-00–17 adalah target Sprint 2; daftar ini tidak berarti seluruhnya sudah diimplementasikan.
- Kontrak dan perubahan data lintas owner harus disepakati sebelum integrasi.
- Prototipe state demo lama tidak boleh dianggap sebagai Firebase persistence atau sinkronisasi real-time.
