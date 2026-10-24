import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ActionButton } from '../../components/ActionButton';
import { AppPage } from '../../components/AppPage';
import { Text } from '../../components/Text';
import { useRole } from '../../core/role-context';
import { colors } from '../../theme/tokens';
import { findAssistantSession } from '../../features/assistant/assistant-sessions';

export default function AssistantSessionDetailRoute() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { currentUser } = useRole();

  if (!currentUser) return <Redirect href="/" />;
  if (currentUser.role !== 'asisten') return <Redirect href="/jadwal" />;

  const session = typeof sessionId === 'string' ? findAssistantSession(sessionId) : null;
  if (!session || session.assistantId !== currentUser.id) return <Redirect href="/jadwal" />;

  return (
    <AppPage title="Detail sesi" subtitle="Informasi pelaksanaan praktikum yang kamu tangani.">
      <View style={styles.statusCard}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>{session.status}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>MATA PRAKTIKUM</Text>
        <Text accessibilityRole="header" style={styles.course}>{session.course}</Text>
        <Text style={styles.description}>{session.description}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Informasi pelaksanaan</Text>
        <DetailRow label="Hari dan tanggal" value={`${session.day}, ${session.date}`} />
        <DetailRow label="Waktu" value={session.time} />
        <DetailRow label="Kelas" value={session.group} />
        <DetailRow label="Ruangan" value={session.room} last />
      </View>

      <View style={styles.note}>
        <Text style={styles.noteTitle}>Tugas asisten</Text>
        <Text style={styles.noteCopy}>
          Dampingi praktikan selama sesi dan pastikan kegiatan berjalan sesuai materi praktikum.
        </Text>
      </View>

      <ActionButton title="Kembali ke jadwal" onPress={() => router.back()} secondary />
    </AppPage>
  );
}

function DetailRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, last && styles.lastRow]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: colors.paleBlue,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.blue },
  statusText: { color: colors.blue, fontSize: 12, fontWeight: '800' },
  card: {
    backgroundColor: colors.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 20,
    gap: 12,
  },
  label: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  course: { color: colors.navy, fontSize: 20, fontWeight: '800', lineHeight: 28 },
  description: { color: colors.muted, fontSize: 13, lineHeight: 21 },
  sectionTitle: { color: colors.navy, fontSize: 15, fontWeight: '800', marginBottom: 2 },
  row: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingVertical: 10,
    gap: 4,
  },
  lastRow: { borderBottomWidth: 0, paddingBottom: 0 },
  rowLabel: { color: colors.muted, fontSize: 11 },
  rowValue: { color: colors.navy, fontSize: 14, fontWeight: '700' },
  note: { backgroundColor: colors.lavender, padding: 18, borderRadius: 20, gap: 7 },
  noteTitle: { color: colors.navy, fontSize: 14, fontWeight: '800' },
  noteCopy: { color: colors.muted, fontSize: 12, lineHeight: 20 },
});
