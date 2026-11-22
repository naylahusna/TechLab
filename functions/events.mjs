export function sessionOpened(before, after, classItem, schedule, sessionId) {
  if (!before || !after || before.status === 'open' || after.status !== 'open' || classItem.archivedAt) return null;
  return {
    recipients: [...new Set(after.studentIds.filter((uid) => classItem.studentIds.includes(uid)))],
    type: 'session-opened', title: 'Presensi praktikum dibuka',
    body: `${classItem.courseName} · ${classItem.className} · ${schedule.title} · ${schedule.location}. Sesi presensi telah dibuka.`,
    path: `/sesi/${sessionId}`, classId: after.classId,
  };
}

const millis = (value) => value?.toMillis?.() ?? value?.getTime?.() ?? null;
const time = (value) => {
  const ms = millis(value);
  return ms === null ? '-' : new Date(ms).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' });
};
export function scheduleChanged(before, after, classItem, id) {
  if (!before || !after || classItem.archivedAt) return null;
  const changes = [];
  if (before.title !== after.title) changes.push(`Judul: ${after.title}`);
  if (millis(before.startAt) !== millis(after.startAt) || millis(before.endAt) !== millis(after.endAt))
    changes.push(`Waktu: ${time(after.startAt)} – ${time(after.endAt)} WIB`);
  if (before.location !== after.location) changes.push(`Lab: ${after.location}`);
  if (!before.archivedAt && after.archivedAt) changes.push('Jadwal dibatalkan/diarsipkan');
  if (!changes.length) return null;
  return { recipients: [...new Set([...classItem.studentIds, ...classItem.assistantIds])],
    type: 'schedule-changed', title: 'Jadwal praktikum berubah',
    body: `${classItem.courseName} · ${classItem.className} · ${after.title}. ${changes.join('. ')}`,
    classId: after.classId, path: `/sesi/${id}` };
}
export function sessionCancelled(before, after, classItem, schedule, id) {
  if (!before || !after || before.status === 'cancelled' || after.status !== 'cancelled' || classItem.archivedAt || schedule.archivedAt) return null;
  return { recipients: [...new Set([...classItem.studentIds, ...classItem.assistantIds])],
    type: 'schedule-cancelled', title: 'Sesi praktikum dibatalkan',
    body: `${classItem.courseName} · ${classItem.className} · ${schedule.title} · ${schedule.location}. Sesi dibatalkan.`,
    classId: after.classId, path: `/sesi/${id}` };
}
