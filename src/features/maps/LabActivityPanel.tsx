import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '../../components/Text';
import { colors } from '../../theme/tokens';
import { findLabActivity, type LabActivity } from './lab-activity';
import { MapSyncNotice } from './MapSyncNotice';
import { useLabActivity } from './useLabActivity';

const date = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'Asia/Jakarta' });
const time = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });

export function LabActivityPanel({ labName }: { labName: string }) {
  const { data, error, fromCache, loading, retry } = useLabActivity();
  const [now, setNow] = useState(Date.now);
  useFocusEffect(useCallback(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []));
  const activity = data && findLabActivity(data, labName, now);
  return (
    <View style={styles.panel}>
      {loading && <Text style={styles.detail}>Memuat aktivitas praktikum…</Text>}
      <MapSyncNotice error={error} fromCache={fromCache} retry={retry} source="aktivitas praktikum" />
      {activity && (
        <>
          <ActivityRow title="Sedang berlangsung" activity={activity.ongoing} empty="Tidak ada aktivitas yang bisa kamu lihat saat ini." />
          <ActivityRow title="Praktikum berikutnya" activity={activity.upcoming} empty="Belum ada jadwal berikutnya yang bisa kamu lihat." />
        </>
      )}
    </View>
  );
}

function ActivityRow({ title, activity, empty }: { title: string; activity?: LabActivity; empty: string }) {
  const start = activity?.schedule.startAt.toDate();
  const end = activity?.schedule.endAt.toDate();
  return (
    <View style={styles.row}>
      <Text accessibilityRole="header" style={styles.heading}>{title}</Text>
      {activity && start && end ? (
        <>
          <Text style={styles.course}>{activity.course.courseName} · {activity.course.className}</Text>
          {activity.schedule.title !== activity.course.courseName && <Text style={styles.detail}>{activity.schedule.title}</Text>}
          <Text style={styles.detail}>{date.format(start)} · {time.format(start)}–{time.format(end)} WIB</Text>
          <Text style={styles.detail}>{activity.status === 'open' ? 'Sesi dibuka' : 'Sesi belum dibuka'}</Text>
        </>
      ) : <Text style={styles.detail}>{empty}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { marginTop: 7, gap: 8 },
  row: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 7, gap: 2 },
  heading: { color: colors.navy, fontWeight: '800', fontSize: 13 },
  course: { color: colors.navy, fontWeight: '700' },
  detail: { color: colors.muted, fontSize: 12 },
});
