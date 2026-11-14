import { useEffect, useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ActionButton } from '../../../components/ActionButton';
import { Text } from '../../../components/Text';
import { useAuth } from '../../auth/AuthProvider';
import { getPracticumRepository } from '../client';
import { PracticumField } from '../components/PracticumField';
import { PracticumHeader } from '../components/PracticumHeader';
import { ErrorState, LoadingState } from '../components/StateViews';
import { practicumErrorMessage } from '../errors';
import { colors, lineHeights, spacing, typography } from '../theme';
import { validateClassInput } from '../validation';

type ClassFormScreenProps = {
  mode: 'create' | 'edit';
  classId?: string;
};

export function ClassFormScreen({ mode, classId }: ClassFormScreenProps) {
  const auth = useAuth();
  const router = useRouter();
  const [className, setClassName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [loading, setLoading] = useState(mode === 'edit');
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode !== 'edit' || !classId) return;
    let active = true;
    getPracticumRepository()
      .getClass(classId)
      .then((item) => {
        if (!active) return;
        if (!item) {
          setLoadFailed(true);
          setError('Kelas tidak ditemukan.');
          return;
        }
        setClassName(item.className);
        setCourseName(item.courseName);
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
  }, [mode, classId, reloadKey]);

  if (!auth.profile) return <Redirect href="/" />;

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/kelas');
  }

  function retryLoad() {
    setLoading(true);
    setLoadFailed(false);
    setError('');
    setReloadKey((key) => key + 1);
  }

  async function submit() {
    if (!auth.profile || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const clean = validateClassInput({ className, courseName });
      if (mode === 'create') {
        await getPracticumRepository().createClass(clean, auth.profile.uid);
        router.replace('/kelas');
      } else if (classId) {
        await getPracticumRepository().updateClass(classId, clean);
        router.replace(`/kelas/${classId}`);
      } else {
        throw new Error('Kelas tidak ditemukan.');
      }
    } catch (cause) {
      setError(practicumErrorMessage(cause));
    } finally {
      setSubmitting(false);
    }
  }

  const title = mode === 'create' ? 'Tambah Kelas' : 'Edit Kelas';
  const subtitle =
    mode === 'create'
      ? 'Buat kelas praktikum baru. Kamu otomatis menjadi asisten kelas ini.'
      : 'Perbarui informasi kelas praktikum.';

  return (
    <View style={styles.screen}>
      <PracticumHeader
        eyebrow="Asisten"
        title={title}
        subtitle={subtitle}
        onBack={goBack}
      />

      {mode === 'edit' && loading ? <LoadingState message="Memuat kelas…" /> : null}

      {mode === 'edit' && !loading && loadFailed ? (
        <ErrorState message={error || 'Kelas tidak ditemukan.'} onRetry={retryLoad} />
      ) : null}

      {(!loading && !loadFailed) || mode === 'create' ? (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <PracticumField
              label="Nama Kelas"
              value={className}
              onChangeText={setClassName}
              placeholder="Contoh: Informatika A"
              editable={!submitting}
            />
            <PracticumField
              label="Mata Kuliah"
              value={courseName}
              onChangeText={setCourseName}
              placeholder="Contoh: Pemrograman Perangkat Bergerak"
              editable={!submitting}
              maxLength={120}
            />
            <Text style={styles.note}>
              Kamu otomatis menjadi asisten kelas ini. Penambahan asisten lain dapat
              dilakukan pada tahap berikutnya.
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
                    ? 'Tambah Kelas'
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
