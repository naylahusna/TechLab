# Shared Components

Folder `src/components` berisi komponen UI yang digunakan bersama oleh lebih dari satu fitur. Tujuan utamanya adalah menjaga konsistensi tampilan, mengurangi duplikasi kode, dan memudahkan pemeliharaan antarmuka.

## Kontribusi prototipe terdahulu

Komponen bersama tidak memiliki owner fitur tunggal. Kontribusi awal penataan
komponen bersama dilakukan Arga Yura Danendra pada commit `57b56a8`; komponen
khusus tetap dimiliki owner fitur pemakainya.

## Prinsip

- Komponen umum harus bersifat presentasional dan reusable.
- Hindari menyimpan state bisnis di sini; state dikelola di `src/core`.
- Gunakan token dari `src/theme` agar styling antar modul tetap selaras.
- Nama komponen dan props harus jelas agar mudah dipakai oleh fitur lain.

## Peran folder

Komponen di sini sebaiknya tidak dibatasi hanya untuk satu layar, tetapi digunakan oleh beberapa bagian aplikasi. Jika komponen hanya relevan untuk satu fitur saja, sebaiknya diletakkan di folder fitur masing-masing.

## Sprint 1

Folder ini mendukung komponen reusable prototipe presensi. Komponen khusus
tetap mengikuti owner fitur pemakainya.

## Sprint 2

Komponen folder ini dapat mendukung UI SRS-00–17 Sprint 2. Komponen khusus
mengikuti owner kebutuhan masing-masing; komponen shared dikoordinasikan bersama.

## Pembagian tugas

| Programmer | Owner | Tanggung jawab terkait komponen |
|---|---|---|
| Owner fitur terkait | Nayla Husna, Zaidan Ardiyansyah, atau Arga Yura Danendra | Komponen yang hanya dipakai satu fitur dikelola owner fitur; komponen shared dikoordinasikan bersama. |

## Catatan integrasi

- Komponen umum harus reusable dan tidak bergantung pada state bisnis lokal yang berlebihan.
- Gunakan token dari `src/theme` agar visual tetap konsisten.
- Komponen spesifik fitur tetap ditempatkan pada folder modul masing-masing.
- Owner fitur bertanggung jawab atas komponen khusus fiturnya; perubahan komponen bersama dikoordinasikan dan direview bersama.
