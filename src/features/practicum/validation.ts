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
  const studentNumber = input.studentNumber.trim();
  if (!ID_PATTERN.test(classId)) throw new Error('ID kelas tidak valid.');
  if (!ID_PATTERN.test(userId)) throw new Error('ID pengguna tidak valid.');
  if (!NUMBER_PATTERN.test(studentNumber))
    throw new Error('NIM/ID harus berisi 1–32 huruf, angka, titik, atau tanda hubung.');
  return { classId, userId, studentNumber };
}

export function validateScheduleInput(input: PracticumScheduleInput) {
  const classId = input.classId.trim();
  const title = input.title.trim();
  const location = input.location.trim();
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
  return { classId, title, startAt: input.startAt, endAt: input.endAt, location };
}
