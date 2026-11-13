# Urutan PR Fondasi TechLab — Sprint 1

Empat branch terpisah menggantikan kebutuhan PR branch gabungan
`feature/srs-15-21-22-25-shared-state`. Gunakan seri ini untuk review per SRS;
branch gabungan tetap disimpan sebagai referensi dan tidak perlu ikut di-merge.

| Urutan | Branch / head PR                      | Base PR                        |
| ------ | ------------------------------------- | ------------------------------ |
| 1      | `feature/srs-21-data-dummy`           | `fix/design-ui`                |
| 2      | `feature/srs-22-state-bersama`        | `feature/srs-21-data-dummy`    |
| 3      | `feature/srs-25-validasi-aksi`        | `feature/srs-22-state-bersama` |
| 4      | `feature/srs-15-cegah-presensi-ganda` | `feature/srs-25-validasi-aksi` |

Branch terakhir berisi semua pendahulunya. Base mengikuti tabel agar diff
setiap PR hanya berisi tahap SRS tersebut. Merge berurutan 21 → 22 → 25 → 15.
PR desain dan SRS-01–04 perlu terintegrasi lebih dahulu ke branch integrasi tim.

Setelah base suatu PR di-merge, PM menyesuaikan target PR lanjutan ke branch
integrasi tim sesuai workflow repo (misalnya develop). Jika PM memakai squash
merge, periksa ulang diff karena commit pendahulu bisa tampil lagi; rebase
branch lanjutan sebelum merge bila diperlukan. Tidak ada merge otomatis.

Pembagian tahap:

- SRS-21: tipe dan fixture lokal.
- SRS-22: provider/snapshot bersama, pembacaan, pergantian identitas, dan reset.
- SRS-25: validasi serta aksi buka/tutup sesi; pemeriksaan syarat presensi.
- SRS-15: pencatatan presensi atomik dan penolakan duplikasi, plus tes demo lengkap.

Seluruh UI praktikan/asisten tetap di folder owner masing-masing. API lama
`useRole()` tetap kompatibel. SRS-22 mempertahankan state contoh saat berganti
pengguna; tes perubahan sesi ditambahkan pada SRS-25 dan tes perubahan presensi
lintas peran ditambahkan pada SRS-15.

## Catatan Sprint 2

Urutan pada tabel di atas hanya berlaku untuk rangkaian SRS fondasi Sprint 1.
SRS-00–17 pada Sprint 2 adalah kebutuhan baru dengan penomoran terpisah dan
spesifikasinya berada di `docs/sprint-2/`. Owner Sprint 2 dicatat di
`../sprint-2/SRS-OWNERSHIP.md`; urutan implementasinya dijelaskan di
`../sprint-2/SRS-PR-ORDER.md`, bukan pada tabel PR prototipe Sprint 1 di atas.
