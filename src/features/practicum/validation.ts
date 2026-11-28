import type {
  PracticumClassInput,
  PracticumParticipantInput,
  PracticumScheduleInput,
} from './types';

const ID_PATTERN = /^[A-Za-z0-9.-]{1,64}$/;
const NUMBER_PATTERN = /^[A-Za-z0-9.-]{1,32}$/;

export function validateClassInput(input: PracticumClassInput) {
  const className = input.className.trim();
  const courseName = input.courseName.trim();
  if (className.length < 1 || className.length > 100)
    throw new Error('Nama kelas harus terdiri dari 1–100 karakter.');
  if (courseName.length < 1 || courseName.length > 100)
    throw new Error('Nama mata kuliah harus terdiri dari 1–100 karakter.');
  const assistantIds = input.assistantIds
    ? Array.from(new Set(input.assistantIds.map((id) => id.trim()).filter(Boolean)))
    : undefined;
  if (assistantIds && assistantIds.length === 0)
    throw new Error('Minimal satu asisten harus ditunjuk.');
  if (assistantIds && assistantIds.length > 20)
    throw new Error('Maksimal 20 asisten per kelas.');
  return { className, courseName, assistantIds };
}

export function validateParticipantInput(input: PracticumParticipantInput) {
  const classId = input.classId.trim();
  const userId = input.userId.trim();
  const studentName = input.studentName.trim();
  const studentNumber = input.studentNumber.trim();
  if (!ID_PATTERN.test(classId)) throw new Error('ID kelas tidak valid.');
  if (!ID_PATTERN.test(userId)) throw new Error('ID pengguna tidak valid.');
  if (studentName.length < 2 || studentName.length > 100)
    throw new Error('Nama peserta harus terdiri dari 2–100 karakter.');
  if (!NUMBER_PATTERN.test(studentNumber))
    throw new Error('NIM/ID harus berisi 1–32 huruf, angka, titik, atau tanda hubung.');
  return { classId, userId, studentName, studentNumber };
}

export function validateScheduleInput(input: PracticumScheduleInput) {
  const classId = input.classId.trim();
  const title = input.title.trim();
  const location = input.location.trim();
  const labId = input.labId?.trim();
  if (input.labId !== undefined && (!labId || !ID_PATTERN.test(labId))) throw new Error('ID lab tidak valid.');
  if (!ID_PATTERN.test(classId)) throw new Error('ID kelas tidak valid.');
  if (title.length < 1 || title.length > 120)
    throw new Error('Judul jadwal harus terdiri dari 1–120 karakter.');
  if (location.length < 1 || location.length > 120)
    throw new Error('Lokasi harus terdiri dari 1–120 karakter.');
  if (!(input.startAt instanceof Date) || Number.isNaN(input.startAt.getTime()))
    throw new Error('Waktu mulai tidak valid.');
  if (!(input.endAt instanceof Date) || Number.isNaN(input.endAt.getTime()))
    throw new Error('Waktu selesai tidak valid.');
  if (input.startAt.getTime() >= input.endAt.getTime())
    throw new Error('Waktu selesai harus setelah waktu mulai.');
  return { classId, title, startAt: input.startAt, endAt: input.endAt, location, ...(labId ? { labId } : {}) };
}

export type SessionOpenWindowResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; reason: 'too-late'; message: string }>;

export function validateSessionOpenWindow(
  scheduleWindow: {
    startAt: Date | { toDate(): Date };
    endAt: Date | { toDate(): Date };
  },
  now: Date = new Date(),
): SessionOpenWindowResult {
  const end =
    scheduleWindow.endAt instanceof Date
      ? scheduleWindow.endAt
      : scheduleWindow.endAt.toDate();
  const nowMs = now.getTime();
  if (nowMs > end.getTime()) {
    return {
      ok: false,
      reason: 'too-late',
      message: 'Sesi tidak dapat dibuka karena waktu jadwal praktikum sudah lewat.',
    };
  }
  return { ok: true };
}

export const SCHEDULE_TIME_OPTIONS: readonly string[] = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2);
  const minute = index % 2 === 0 ? '00' : '30';
  return `${String(hour).padStart(2, '0')}:${minute}`;
});

function padTwo(value: number): string {
  return String(value).padStart(2, '0');
}

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${padTwo(date.getMonth() + 1)}-${padTwo(date.getDate())}`;
}

function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
}

function slotDateTime(day: Date, slot: string): Date {
  const [hour, minute] = slot.split(':').map(Number);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute, 0, 0);
}

/**
 * Mengembalikan pilihan jam mulai yang valid secara real-time untuk tanggal tertentu.
 * Tanggal sebelum hari ini mengembalikan array kosong; hari ini hanya memuat slot setelah `now`
 * dan menyisakan minimal satu slot jam selesai (`<= 23:00`).
 */
export function getAvailableStartTimes(dateValue: string, now: Date = new Date()): string[] {
  const startSlots = SCHEDULE_TIME_OPTIONS.slice(0, -1);
  if (!dateValue.trim()) return [...startSlots];
  const day = parseDateOnly(dateValue);
  if (!day) return [];

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (day.getTime() < todayStart.getTime()) return [];
  if (day.getTime() > todayStart.getTime()) return [...startSlots];

  return startSlots.filter((slot) => slotDateTime(day, slot).getTime() > now.getTime());
}

/**
 * Mengembalikan pilihan jam selesai yang valid secara real-time:
 * selalu setelah `startTime` (bila sudah dipilih) dan setelah `now` bila tanggal adalah hari ini.
 */
export function getAvailableEndTimes(
  dateValue: string,
  startTime: string,
  now: Date = new Date(),
): string[] {
  if (!dateValue.trim()) {
    return startTime
      ? SCHEDULE_TIME_OPTIONS.filter((slot) => slot > startTime)
      : [...SCHEDULE_TIME_OPTIONS];
  }
  const day = parseDateOnly(dateValue);
  if (!day) return [];

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (day.getTime() < todayStart.getTime()) return [];

  const isToday = day.getTime() === todayStart.getTime();
  return SCHEDULE_TIME_OPTIONS.filter((slot) => {
    if (startTime && slot <= startTime) return false;
    if (isToday && slotDateTime(day, slot).getTime() <= now.getTime()) return false;
    return true;
  });
}

/**
 * Tanggal minimum yang bisa dipilih pada kalender jadwal: hari ini bila masih ada
 * slot jam mulai tersisa, atau besok bila waktu hari ini sudah melewati slot terakhir.
 */
export function getMinScheduleDate(now: Date = new Date()): Date {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (getAvailableStartTimes(localDateKey(todayStart), now).length > 0) {
    return todayStart;
  }
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
}

export function validateScheduleNotInPast(startAt: Date, now: Date = new Date()): void {
  if (startAt.getTime() < now.getTime()) {
    throw new Error('Tanggal dan jam mulai jadwal tidak boleh di masa lalu.');
  }
}
