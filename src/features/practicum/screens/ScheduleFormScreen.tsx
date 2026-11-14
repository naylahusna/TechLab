import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ActionButton } from '../../../components/ActionButton';
import { Text } from '../../../components/Text';
import { getPracticumRepository } from '../client';
import { formatDateInput, formatTimeInput, parseDateTime } from '../date-input';
import { PracticumField } from '../components/PracticumField';
import { PracticumHeader } from '../components/PracticumHeader';
import { ErrorState, LoadingState } from '../components/StateViews';
import { practicumErrorMessage } from '../errors';
import { colors, lineHeights, spacing, typography } from '../theme';
import { validateScheduleInput } from '../validation';

type ScheduleFormScreenProps = {
  classId: string;
  mode: 'create' | 'edit';
  scheduleId?: string;
};

export function ScheduleFormScreen({
  classId,
  mode,
  scheduleId,
}: ScheduleFormScreenProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(mode === 'edit');
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode !== 'edit' || !scheduleId) return;
    let active = true;
    getPracticumRepository()
      .getSchedule(scheduleId)
      .then((item) => {
        if (!active) return;
        if (!item) {
          setLoadFailed(true);
          setError('Jadwal tidak ditemukan.');
          return;
        }
        setTitle(item.title);
        setDate(formatDateInput(item.startAt));
        setStartTime(formatTimeInput(item.startAt));
        setEndTime(formatTimeInput(item.endAt));
        setLocation(item.location);
      })
      .catch((cause) => {
        if (!active) return;
        setLoadFailed(true);
        setError(practicumErrorMessage(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [mode, scheduleId, reloadKey]);

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace(`/kelas/${classId}/jadwal`);
  }

  function retryLoad() {
    setLoading(true);
    setLoadFailed(false);
    setError('');
    setReloadKey((key) => key + 1);
  }

  async function submit() {
    if (submitting) return;
    const startAt = parseDateTime(date, startTime);
    const endAt = parseDateTime(date, endTime);
    if (!startAt || !endAt) {
      setError('Gunakan format tanggal YYYY-MM-DD dan jam HH:mm.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const clean = validateScheduleInput({
        classId,
        title,
        startAt,
        endAt,
        location,
      });
      if (mode === 'create') {
        await getPracticumRepository().createSchedule(clean);
      } else if (scheduleId) {
        await getPracticumRepository().updateSchedule(scheduleId, clean);
      } else {
        throw new Error('Jadwal tidak ditemukan.');
      }
      router.replace(`/kelas/${classId}/jadwal`);
    } catch (cause) {
      setError(practicumErrorMessage(cause));
    } finally {
      setSubmitting(false);
    }
  }

  const titleLabel = mode === 'create' ? 'Tambah Jadwal' : 'Edit Jadwal';

  return (
    <View style={styles.screen}>
      <PracticumHeader
        eyebrow="Asisten"
        title={titleLabel}
        subtitle="Atur waktu dan lokasi pertemuan praktikum."
        onBack={goBack}
      />

      {mode === 'edit' && loading ? <LoadingState message="Memuat jadwal…" /> : null}

      {mode === 'edit' && !loading && loadFailed ? (
        <ErrorState message={error || 'Jadwal tidak ditemukan.'} onRetry={retryLoad} />
      ) : null}

      {(!loading && !loadFailed) || mode === 'create' ? (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <PracticumField
              label="Judul Pertemuan"
              value={title}
              onChangeText={setTitle}
              placeholder="Contoh: Pertemuan 5 — UI dan Navigasi"
              editable={!submitting}
              maxLength={120}
            />
            <PracticumField
              label="Tanggal"
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              editable={!submitting}
              maxLength={10}
              autoCapitalize="none"
            />
            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <PracticumField
                  label="Mulai"
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="HH:mm"
                  editable={!submitting}
                  maxLength={5}
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.timeField}>
                <PracticumField
                  label="Selesai"
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="HH:mm"
                  editable={!submitting}
                  maxLength={5}
                  autoCapitalize="none"
                />
              </View>
            </View>
            <PracticumField
              label="Lokasi"
              value={location}
              onChangeText={setLocation}
              placeholder="Contoh: Lab Komputasi 1"
              editable={!submitting}
              maxLength={120}
            />
            <Text style={styles.note}>
              Format tanggal: YYYY-MM-DD. Format jam: HH:mm (24 jam).
            </Text>
            {error ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
            ) : null}
            <ActionButton
              title={
                submitting
                  ? 'Menyimpan…'
                  : mode === 'create'
                    ? 'Tambah Jadwal'
                    : 'Simpan Perubahan'
              }
              onPress={() => {
                void submit();
              }}
              disabled={submitting}
            />
            <ActionButton title="Batal" secondary onPress={goBack} disabled={submitting} />
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  timeRow: { flexDirection: 'row', gap: spacing.md },
  timeField: { flex: 1 },
  note: {
    color: colors.textMuted,
    fontSize: typography.secondary,
    lineHeight: lineHeights.body,
  },
  error: {
    color: colors.danger,
    fontSize: typography.body,
    lineHeight: lineHeights.body,
  },
});
