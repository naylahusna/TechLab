import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { watchLabLocations } from '../../assistant/lab-locations';

import { ActionButton } from '../../../components/ActionButton';
import { Text } from '../../../components/Text';
import { getPracticumRepository } from '../client';
import { formatDateInput, formatTimeInput, parseDateTime } from '../date-input';
import { DatePickerField } from '../components/DatePickerField';
import { OptionPickerField } from '../components/OptionPickerField';
import { PracticumField } from '../components/PracticumField';
import { PracticumHeader } from '../components/PracticumHeader';
import { ErrorState, LoadingState } from '../components/StateViews';
import { practicumErrorMessage } from '../errors';
import { colors, lineHeights, spacing, typography } from '../theme';
import {
  getAvailableEndTimes,
  getAvailableStartTimes,
  getMinScheduleDate,
  validateScheduleInput,
  validateScheduleNotInPast,
} from '../validation';

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
  const [originalLocation, setOriginalLocation] = useState('');
  const [labOptions, setLabOptions] = useState<string[]>([]);
  const [labLoadError, setLabLoadError] = useState('');
  const [now, setNow] = useState(() => new Date());
  const [loading, setLoading] = useState(mode === 'edit');
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    let stop: (() => void) | undefined;
    const fail = () => {
      if (!active) return;
      setLabOptions([]);
      setLabLoadError('Lokasi lab gagal dimuat. Periksa koneksi lalu coba lagi.');
    };
    void getPracticumRepository().getClass(classId).then((course) => {
      if (!active) return;
      if (!course) return fail();
      stop = watchLabLocations((items) => {
        setLabOptions(items.filter((item) => !item.archivedAt
          && (!item.courseName || item.courseName === course.courseName)).map((item) => item.name));
        setLabLoadError('');
      }, fail);
    }).catch(fail);
    return () => {
      active = false;
      stop?.();
    };
  }, [classId]);

  const minSelectableDate = getMinScheduleDate(now);
  const availableStartTimes = getAvailableStartTimes(date, now);
  const availableEndTimes = getAvailableEndTimes(date, startTime, now);

  function handleDateChange(nextDate: string) {
    setDate(nextDate);
    setError('');
    const currentNow = new Date();
    setNow(currentNow);
    const nextStarts = getAvailableStartTimes(nextDate, currentNow);
    const validStart = nextStarts.includes(startTime) ? startTime : '';
    if (validStart !== startTime) setStartTime(validStart);
    const nextEnds = getAvailableEndTimes(nextDate, validStart, currentNow);
    if (endTime && !nextEnds.includes(endTime)) setEndTime('');
  }

  function handleStartTimeChange(nextStartTime: string) {
    setStartTime(nextStartTime);
    setError('');
    const currentNow = new Date();
    setNow(currentNow);
    const nextEnds = getAvailableEndTimes(date, nextStartTime, currentNow);
    if (endTime && !nextEnds.includes(endTime)) setEndTime('');
  }

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
        setOriginalLocation(item.location);
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
    if (!labOptions.includes(location) && !(mode === 'edit' && location && location === originalLocation)) {
      setError('Pilih lab aktif untuk mata kuliah ini.');
      return;
    }
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
      validateScheduleNotInPast(clean.startAt, new Date());
      if (mode === 'create') {
        await getPracticumRepository().createSchedule(clean);
      } else if (scheduleId) {
        await getPracticumRepository().updateSchedule(scheduleId, clean);
      } else {
        throw new Error('Jadwal tidak ditemukan.');
      }
      router.dismissTo(`/kelas/${classId}/jadwal`);
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
            <DatePickerField
              label="Tanggal"
              value={date}
              minDate={minSelectableDate}
              onChange={handleDateChange}
              disabled={submitting}
            />
            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <OptionPickerField
                  label="Mulai"
                  value={startTime}
                  options={availableStartTimes}
                  placeholder="Pilih jam"
                  onChange={handleStartTimeChange}
                  disabled={submitting}
                  includeCurrentValue={false}
                  emptyMessage="Tidak ada jam mulai tersisa untuk tanggal ini. Pilih tanggal berikutnya."
                />
              </View>
              <View style={styles.timeField}>
                <OptionPickerField
                  label="Selesai"
                  value={endTime}
                  options={availableEndTimes}
                  placeholder="Pilih jam"
                  onChange={(nextEndTime) => {
                    setEndTime(nextEndTime);
                    setError('');
                  }}
                  disabled={submitting}
                  includeCurrentValue={false}
                  emptyMessage="Pilih jam mulai terlebih dahulu agar pilihan jam selesai tersedia."
                />
              </View>
            </View>
            <OptionPickerField
              label="Lokasi"
              value={location}
              options={labOptions}
              placeholder="Pilih lab"
              onChange={setLocation}
              disabled={submitting}
              emptyMessage={labLoadError || 'Belum ada lokasi di koleksi labLocations. Tambahkan lokasi terlebih dahulu.'}
            />
            {labLoadError ? <Text accessibilityRole="alert" style={styles.error}>{labLoadError}</Text> : null}
            <Text style={styles.note}>
              Tanggal dan jam hanya dapat dipilih mulai dari waktu sekarang ke depan.
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
