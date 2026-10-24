import { failure, success } from './action-result';
import type { ActionResult, DemoState } from './types';

export function validateSessionAction(
  state: DemoState,
  sessionId: string,
  action: 'open' | 'close',
): ActionResult {
  if (action !== 'open' && action !== 'close') {
    return failure('INVALID_ACTION', 'Tindakan sesi tidak dikenali.');
  }
  const actor = state.users.find((user) => user.id === state.currentUserId);
  if (!actor || actor.role !== state.currentRole) {
    return failure('USER_REQUIRED', 'Pilih pengguna aktif terlebih dahulu.');
  }
  const session = state.sessions.find((item) => item.id === sessionId);
  if (!session) return failure('SESSION_NOT_FOUND', 'Sesi tidak ditemukan.');
  if (actor.role !== 'asisten') {
    return failure('ASSISTANT_REQUIRED', 'Hanya asisten yang dapat mengelola sesi.');
  }
  if (session.assistantId !== actor.id) {
    return failure('NOT_ASSIGNED', 'Sesi ini bukan penugasan asisten aktif.');
  }
  const expectedStatus = action === 'open' ? 'upcoming' : 'open';
  if (session.status !== expectedStatus) {
    return failure(
      'INVALID_SESSION_TRANSITION',
      action === 'open'
        ? 'Hanya sesi Belum Dibuka yang dapat dibuka. Sesi Ditutup tidak dapat dibuka kembali.'
        : 'Hanya sesi Dibuka yang dapat ditutup.',
    );
  }
  return success(action === 'open' ? 'Sesi dapat dibuka.' : 'Sesi dapat ditutup.');
}

/** Also used by UI to explain why the attendance button is disabled. */
export function validateAttendance(
  state: DemoState,
  sessionId: string,
  studentId: string,
): ActionResult {
  const actor = state.users.find((user) => user.id === state.currentUserId);
  if (!actor || actor.role !== state.currentRole) {
    return failure('USER_REQUIRED', 'Pilih pengguna aktif terlebih dahulu.');
  }
  const session = state.sessions.find((item) => item.id === sessionId);
  if (!session) return failure('SESSION_NOT_FOUND', 'Sesi tidak ditemukan.');
  if (actor.role !== 'praktikan') {
    return failure('STUDENT_REQUIRED', 'Hanya praktikan yang dapat melakukan presensi.');
  }
  if (studentId !== actor.id) {
    return failure('IDENTITY_MISMATCH', 'Presensi harus menggunakan identitas praktikan aktif.');
  }
  if (!session.studentIds.includes(actor.id)) {
    return failure('NOT_ENROLLED', 'Praktikan aktif tidak terdaftar pada sesi ini.');
  }
  if (
    state.attendanceRecords.some(
      (record) => record.sessionId === sessionId && record.studentId === studentId,
    )
  ) {
    return failure('ALREADY_PRESENT', 'Kamu sudah melakukan presensi pada sesi ini.');
  }
  if (session.status !== 'open') {
    return failure(
      'SESSION_NOT_OPEN',
      session.status === 'closed' ? 'Sesi telah ditutup.' : 'Sesi belum dibuka.',
    );
  }
  return success('Presensi tersedia.');
}
