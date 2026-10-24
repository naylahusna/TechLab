export type AssistantSession = Readonly<{
  id: string;
  assistantId: string;
  day: string;
  date: string;
  time: string;
  course: string;
  group: string;
  room: string;
  status: 'Akan datang' | 'Sedang berlangsung' | 'Selesai';
  description: string;
}>;

export const assistantSessions: readonly AssistantSession[] = [
  {
    id: 'session-01',
    assistantId: 'asisten-01',
    day: 'Senin',
    date: '26 Okt 2026',
    time: '09.00–11.00',
    course: 'Praktikum Algoritma dan Pemrograman',
    group: 'Informatika · Kelas A',
    room: 'Lab Komputasi 1',
    status: 'Akan datang',
    description: 'Pengenalan algoritma, variabel, dan struktur kontrol menggunakan bahasa pemrograman Python.',
  },
  {
    id: 'session-02',
    assistantId: 'asisten-01',
    day: 'Rabu',
    date: '28 Okt 2026',
    time: '13.00–15.00',
    course: 'Praktikum Basis Data',
    group: 'Informatika · Kelas B',
    room: 'Lab Komputasi 2',
    status: 'Akan datang',
    description: 'Latihan perancangan basis data relasional dan penggunaan perintah SQL dasar.',
  },
  {
    id: 'session-03',
    assistantId: 'asisten-02',
    day: 'Selasa',
    date: '27 Okt 2026',
    time: '10.00–12.00',
    course: 'Praktikum Jaringan Komputer',
    group: 'Informatika · Kelas A',
    room: 'Lab Jaringan',
    status: 'Akan datang',
    description: 'Praktik konfigurasi jaringan lokal dan pengujian konektivitas antarperangkat.',
  },
  {
    id: 'session-04',
    assistantId: 'asisten-02',
    day: 'Kamis',
    date: '29 Okt 2026',
    time: '13.00–15.00',
    course: 'Praktikum Sistem Operasi',
    group: 'Informatika · Kelas B',
    room: 'Lab Komputasi 1',
    status: 'Akan datang',
    description: 'Pengenalan proses, manajemen berkas, dan penggunaan perintah dasar sistem operasi.',
  },
];

export function findAssistantSession(sessionId: string) {
  return assistantSessions.find((session) => session.id === sessionId) ?? null;
}
