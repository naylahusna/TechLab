import type { Timestamp } from 'firebase/firestore';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatDateInput(timestamp: Timestamp): string {
  const date = timestamp.toDate();
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatTimeInput(timestamp: Timestamp): string {
  const date = timestamp.toDate();
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Parse input lokal `YYYY-MM-DD` + `HH:mm` menjadi Date. */
export function parseDateTime(dateText: string, timeText: string): Date | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText.trim());
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeText.trim());
  if (!dateMatch || !timeMatch) return null;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (hour > 23 || minute > 59) return null;

  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute
  ) {
    return null;
  }
  return date;
}
