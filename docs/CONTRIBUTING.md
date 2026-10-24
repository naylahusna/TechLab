# Panduan Kontribusi Tim

## Struktur kerja

```text
src/
├── app/                  # route Expo Router saja
│   ├── (tabs)/           # navigasi utama
│   └── sesi/             # detail sesi dan rekap
├── core/                 # state, tipe, data dummy, aturan bisnis
├── components/           # komponen UI lintas fitur
├── features/
│   ├── auth/             # Arga: pilih peran dan identitas
│   ├── profile/          # Arga: ganti pengguna/reset demo
│   ├── practitioner/     # Zaidaan: alur praktikan
│   └── assistant/        # Fahri: alur asisten
└── theme/                # token warna, spacing, typography
```

## Cara menghindari konflik

- Kerjakan hanya file pada folder ownership masing-masing.
- Jangan membuat salinan `sessions`, `attendanceRecords`, atau context sendiri.
- Jika membutuhkan data baru, ajukan perubahan pada tipe/data di `src/core/`.
- Jika membutuhkan komponen umum, buat di branch sendiri lalu koordinasikan
  sebelum branch lain mengubah file yang sama.
- Route yang sama tidak boleh dikerjakan dua orang sekaligus. Pisahkan screen ke
  folder fitur dan lakukan wiring route dalam satu pull request integrasi.
- Setiap PR harus menyebutkan SRS yang selesai dan hasil lint/typecheck.

## Urutan integrasi yang disarankan

1. Arga membuat tipe, data dummy, dan state bersama.
2. Zaidaan dan Fahri membangun UI fitur menggunakan kontrak state tersebut.
3. Arga melakukan wiring pemilihan pengguna dan navigasi.
4. Tim menjalankan demo lintas peran dari buka sesi sampai sesi ditutup.
