import { useDemo, selectMyAttendance } from '../../core';
import { NavigationLandingScreen } from '../../features/navigation/NavigationLandingScreen';
import { RiwayatScreen } from '../../features/practitioner';
import {
  formatDateLabel,
  formatTimeLabel,
  mapAttendanceStatus,
} from '../../features/practitioner/lib/argamapping';
import type { RiwayatItem } from '../../features/practitioner';

export default function RecordsRoute() {
  const demo = useDemo();

  if (demo.currentUser?.role !== 'praktikan') {
    return <NavigationLandingScreen page="catatan" />;
  }

  const items: RiwayatItem[] = selectMyAttendance(demo)
    .filter((entry) => entry.status !== 'pending')
    .map((entry) => ({
      id: `${entry.session.id}:${entry.student.id}`,
      sessionId: entry.session.id,
      practicalName: entry.session.practicumName,
      meetingLabel: `Pertemuan ${entry.session.meeting}`,
      dateLabel: formatDateLabel(entry.session.startsAt),
      status: mapAttendanceStatus(entry.status),
      attendedAtLabel: entry.record ? formatTimeLabel(entry.record.recordedAt) : null,
    }));

  return <RiwayatScreen items={items} />;
}
