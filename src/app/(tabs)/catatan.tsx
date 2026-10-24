import { useRouter } from 'expo-router';

import {
  useDemo,
  selectAttendanceSummary,
  selectMyAttendance,
  selectMySessions,
} from '../../core';
import {
  AssistantRekapScreen,
  toAssistantSessionItem,
  type SessionWithSummary,
} from '../../features/assistant';
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
  const router = useRouter();

  if (!demo.currentUser) {
    return <NavigationLandingScreen page="catatan" />;
  }

  if (demo.currentUser.role === 'asisten') {
    const sessions = selectMySessions(demo);
    const items: SessionWithSummary[] = sessions.map((session) => {
      const summary = selectAttendanceSummary(demo, session.id) ?? {
        total: session.studentIds.length,
        present: 0,
        notPresent: session.studentIds.length,
      };

      return {
        session: toAssistantSessionItem(session),
        summary,
      };
    });

    return (
      <AssistantRekapScreen
        items={items}
        assistantName={demo.currentUser.name}
        assistantInitials={demo.currentUser.initials}
        onSelectSession={(sessionId) => router.push(`/sesi/${sessionId}`)}
      />
    );
  }

  const items: RiwayatItem[] = selectMyAttendance(demo)
    .filter((entry) => entry.status !== 'pending')
    .map((entry) => ({
      id: `${entry.session.id}:${entry.student.id}`,
      sessionId: entry.session.id,
      practicalName: entry.session.practicumName,
      meetingLabel: `Pertemuan ${entry.session.meeting}`,
      dateLabel: formatDateLabel(entry.session.startsAt),
      startsAt: entry.session.startsAt,
      status: mapAttendanceStatus(entry.status),
      attendedAtLabel: entry.record ? formatTimeLabel(entry.record.recordedAt) : null,
    }));

  return (
    <RiwayatScreen
      items={items}
      praktikanName={demo.currentUser.name}
      praktikanInitials={demo.currentUser.initials}
    />
  );
}
