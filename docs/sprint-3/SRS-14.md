# SRS-14 — Permission Decision Push Notification

**Sprint:** 3
**Owner:** Arga Yura Danendra (Programmer 3 — Push Notification & Device Condition Handling)  
**Peran terkait:** Asisten yang mengambil keputusan pengajuan izin; praktikan pemohon izin; layanan push notification.

## Tujuan

Mengirimkan push notification kepada praktikan pemohon ketika pengajuan izinnya diterima (`approved`) atau ditolak (`rejected`) oleh asisten.

## Kebutuhan

- Sistem mendeteksi peristiwa ketika asisten memberikan keputusan atas pengajuan izin:
  - Pengajuan izin diterima (`approved`).
  - Pengajuan izin ditolak (`rejected`).
- Notifikasi hanya dikirimkan kepada praktikan pemohon izin terkait (sesuai `userId` dokumen izin), tidak kepada praktikan lain.
- Isi notifikasi memuat nama sesi/praktikum, status keputusan (**Diterima** atau **Ditolak**), serta alasan penolakan apabila pengajuan ditolak.
- Pemberitahuan konsisten dengan status keputusan yang tersimpan di Cloud Firestore.

## Kriteria penerimaan

1. Ketika asisten menerima pengajuan izin, praktikan pemohon menerima push notification bahwa izinnya diterima.
2. Ketika asisten menolak pengajuan izin, praktikan pemohon menerima push notification bahwa izinnya ditolak beserta alasan penolakannya.
3. Praktikan lain tidak menerima notifikasi keputusan izin milik pemohon tersebut.
4. Keputusan izin di Firestore tetap tersimpan sah meskipun pengiriman push notification mengalami gangguan.

## Status

Dokumen ini mencatat kebutuhan Sprint 3; status implementasi harus diverifikasi terpisah.
