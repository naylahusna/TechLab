import { Redirect, router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppPage } from '../../components/AppPage';
import { Text } from '../../components/Text';
import { sessionStatusLabels, useDemo } from '../../core';
import { colors } from '../../theme/tokens';
import { formatSessionDate, formatSessionTimeRange, selectAssistantSessions } from './session-view';

/** Adapted from Fahri's assistant UI; all content now comes from the shared core. */
export function AssistantScheduleScreen({ page = 'jadwal' }: { page?: 'jadwal' | 'catatan' }) {
  const demo = useDemo();
  if (!demo.currentUser) return <Redirect href="/" />;
  if (demo.currentUser.role !== 'asisten') return <Redirect href="/jadwal" />;
  const items = selectAssistantSessions(demo);
  const recap = page === 'catatan';

  return (
    <AppPage
      title={recap ? 'Rekap kehadiran' : 'Sesi yang ditangani'}
      subtitle={
        recap
          ? 'Pilih sesi untuk melihat kehadiran dan waktu presensi peserta.'
          : 'Jadwal praktikum yang menjadi tanggung jawabmu.'
      }
    >
      <View style={styles.summary}>
        <View style={styles.summaryMark} />
        <View style={styles.summaryCopy}>
          <Text style={styles.summaryTitle}>{recap ? 'Rekap sesi' : 'Jadwal praktikum'}</Text>
          <Text style={styles.summaryDescription}>{items.length} sesi ditugaskan kepadamu</Text>
        </View>
        <Text style={styles.summaryCount}>{String(items.length).padStart(2, '0')}</Text>
      </View>
      {items.length > 0 ? (
        <View style={styles.list}>
          {items.map(({ session, summary }) => (
            <Pressable
              key={session.id}
              testID={`assistant-session-${session.id}`}
              accessibilityRole="button"
              accessibilityLabel={`Lihat ${recap ? 'rekap' : 'detail'} ${session.practicumName}, pertemuan ${session.meeting}`}
              onPress={() => router.push({ pathname: '/sesi/[id]', params: { id: session.id } })}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            >
              <View style={styles.cardTop}>
                <Text style={styles.time}>
                  {formatSessionTimeRange(session.startsAt, session.endsAt)}
                </Text>
                <View style={styles.status}>
                  <Text style={styles.statusText}>{sessionStatusLabels[session.status]}</Text>
                </View>
              </View>
              <Text style={styles.course}>{session.practicumName}</Text>
              <Text style={styles.meta}>
                Pertemuan {session.meeting} · {session.className}
              </Text>
              <Text style={styles.meta}>{formatSessionDate(session.startsAt)}</Text>
              <Text style={styles.meta}>{session.lab}</Text>
              <Text style={styles.attendance}>
                {summary.present} Hadir · {summary.notPresent}{' '}
                {session.status === 'closed' ? 'Tidak Hadir' : 'Belum Hadir'}
              </Text>
              <Text style={styles.link}>
                {recap ? 'Lihat rekap peserta →' : 'Lihat detail sesi →'}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            {recap ? 'Belum ada rekap sesi' : 'Belum ada sesi untukmu'}
          </Text>
          <Text style={styles.meta}>
            Jadwal dan rekap akan tampil setelah ada sesi yang ditugaskan kepadamu.
          </Text>
        </View>
      )}
    </AppPage>
  );
}

const styles = StyleSheet.create({
  summary: {
    backgroundColor: colors.lime,
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryMark: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success },
  summaryCopy: { flex: 1, gap: 4 },
  summaryTitle: { color: colors.navy, fontSize: 14, fontWeight: '800' },
  summaryDescription: { color: colors.muted, fontSize: 12 },
  summaryCount: { color: colors.navy, fontSize: 23, fontWeight: '800' },
  list: { gap: 12 },
  card: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    gap: 9,
  },
  pressed: { opacity: 0.76 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  time: { color: colors.blue, fontSize: 12, fontWeight: '800' },
  status: {
    backgroundColor: colors.paleBlue,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: { color: colors.blue, fontSize: 10, fontWeight: '700' },
  course: { color: colors.navy, fontSize: 16, lineHeight: 23, fontWeight: '800' },
  meta: { color: colors.muted, fontSize: 12, lineHeight: 20 },
  attendance: { color: colors.navy, fontSize: 12, fontWeight: '700' },
  link: { color: colors.blue, fontSize: 12, fontWeight: '800', marginTop: 4 },
  empty: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 22,
    padding: 24,
    gap: 8,
  },
  emptyTitle: { color: colors.navy, fontSize: 16, fontWeight: '800' },
});
