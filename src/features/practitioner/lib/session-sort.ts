import type { RiwayatItem, SessionListItem } from '../types';

const STATUS_ORDER: Record<SessionListItem['status'], number> = {
  dibuka: 0,
  'belum-dibuka': 1,
  ditutup: 2,
};

/** Sesi yang sedang dibuka tampil lebih dulu, lalu yang akan datang. */
export function sortSessionsForSchedule(sessions: SessionListItem[]): SessionListItem[] {
  return [...sessions].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
}

/** Riwayat terbaru tampil lebih dulu. */
export function sortHistoryByDate(items: RiwayatItem[]): RiwayatItem[] {
  return [...items].sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt));
}
