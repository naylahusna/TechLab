# Core

Owner: Arga. `types.ts`, `users.ts`, dan `demo-data.ts` menyediakan data dummy.
`demo-store.ts` memiliki satu snapshot per provider dan subscription React.
`demo-context.tsx` menghubungkan store ke React; `role-context.tsx` adalah
alias kompatibel untuk screen SRS-01–04, tanpa provider atau state kedua.

API fitur dibaca dari `src/core/index.ts`. Pada tahap SRS-22 tersedia
snapshot, selector, pemilihan pengguna, dan reset. Mutasi sesi tervalidasi
ditambahkan di SRS-25 dan pencatatan presensi di SRS-15. Jangan mengubah
array fixture atau memasang provider di screen/tab/komponen pemilihan.

Detail field, perilaku selector, dan urutan integrasi tersedia di
`docs/CORE-API.md` dan `docs/SRS-PR-ORDER.md`.
