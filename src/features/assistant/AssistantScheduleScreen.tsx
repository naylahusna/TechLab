import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { AppPage } from '../../components/AppPage';
import { Text } from '../../components/Text';
import { useRole } from '../../core/role-context';
import { colors } from '../../theme/tokens';
import { assistantSessions } from './assistant-sessions';

export function AssistantScheduleScreen() {
  const { currentUser } = useRole();
  const items = assistantSessions
    .filter((session) => session.assistantId === currentUser?.id)
    .sort((left, right) => left.date.localeCompare(right.date));

  return (
    <AppPage
      title="Sesi yang ditangani"
      subtitle="Jadwal praktikum yang menjadi tanggung jawabmu."
    >
      <View style={styles.summary}>
        <View style={styles.summaryMark} />
        <View style={styles.summaryCopy}>
          <Text style={styles.summaryTitle}>Jadwal praktikum</Text>
          <Text style={styles.summaryDescription}>
            {items.length} sesi ditugaskan kepadamu
          </Text>
        </View>
        <Text style={styles.summaryCount}>{String(items.length).padStart(2, '0')}</Text>
      </View>

      {items.length > 0 ? (
        <View style={styles.list}>
          {items.map((session, index) => (
            <Pressable
              key={session.id}
              accessibilityRole="button"
              accessibilityLabel={`Lihat detail ${session.course}`}
              onPress={() => router.push({ pathname: '/sesi/[sessionId]', params: { sessionId: session.id } })}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            >
              <View style={styles.dateColumn}>
                <Text style={styles.day}>{session.day}</Text>
                <Text style={styles.date}>{session.date}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.details}>
                <View style={styles.cardTop}>
                  <Text style={styles.time}>{session.time}</Text>
                  <View style={styles.status}>
                    <Text style={styles.statusText}>{session.status}</Text>
                  </View>
                </View>
                <Text style={styles.course}>{session.course}</Text>
                <Text style={styles.meta}>{session.group}</Text>
                <Text style={styles.room}>{session.room}</Text>
              </View>
              {index < items.length - 1 ? <View style={styles.cardSpacer} /> : null}
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Belum ada sesi untukmu</Text>
          <Text style={styles.emptyDescription}>
            Jadwal praktikum yang ditugaskan kepadamu akan tampil di halaman ini.
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  pressed: { opacity: 0.76 },
  dateColumn: { width: 72, gap: 5, paddingTop: 2 },
  day: { color: colors.navy, fontSize: 13, fontWeight: '800' },
  date: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  divider: { width: 1, alignSelf: 'stretch', backgroundColor: colors.line },
  details: { flex: 1, gap: 7 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  time: { color: colors.blue, fontSize: 12, fontWeight: '800' },
  status: { backgroundColor: colors.paleBlue, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12 },
  statusText: { color: colors.blue, fontSize: 10, fontWeight: '700' },
  course: { color: colors.navy, fontSize: 14, lineHeight: 21, fontWeight: '800', marginTop: 2 },
  meta: { color: colors.muted, fontSize: 12 },
  room: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  cardSpacer: { position: 'absolute', height: 1, bottom: -7, left: 20, right: 20 },
  empty: { backgroundColor: colors.white, borderColor: colors.line, borderWidth: 1, borderRadius: 22, padding: 24, gap: 8 },
  emptyTitle: { color: colors.navy, fontSize: 16, fontWeight: '800' },
  emptyDescription: { color: colors.muted, fontSize: 13, lineHeight: 21 },
});
