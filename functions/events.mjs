export function sessionOpened(before, after, classItem, schedule, sessionId) {
  if (!before || !after || before.status === 'open' || after.status !== 'open' || classItem.archivedAt) return null;
  return {
    recipients: [...new Set(after.studentIds.filter((uid) => classItem.studentIds.includes(uid)))],
    type: 'session-opened', title: 'Presensi praktikum dibuka',
    body: `${classItem.courseName} · ${classItem.className} · ${schedule.title} · ${schedule.location}. Sesi presensi telah dibuka.`,
    path: `/sesi/${sessionId}`, classId: after.classId,
  };
}
