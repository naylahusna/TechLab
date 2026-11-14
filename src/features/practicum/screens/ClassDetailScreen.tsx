import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ActionButton } from '../../../components/ActionButton';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import { Text } from '../../../components/Text';
import { Badge } from '../../practitioner/components/Badge';
import { getPracticumRepository } from '../client';
import { InlineAction } from '../components/InlineAction';
import { PracticumHeader } from '../components/PracticumHeader';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { SyncStatusBanner } from '../components/SyncStatusBanner';
import { practicumErrorMessage } from '../errors';
import { usePracticumClass } from '../hooks';
import { colors, fontWeights, lineHeights, radius, spacing, typography } from '../theme';

export function ClassDetailScreen({ classId }: { classId: string }) {
  const router = useRouter();
  const { status, item, error, reload, syncError, fromCache, retrySync } =
    usePracticumClass(classId);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState('');

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/kelas');
  }

  function goEdit() {
    router.push(`/kelas/${classId}/edit`);
  }

  function goParticipants() {
    router.push(`/kelas/${classId}/peserta`);
  }

  function goSchedules() {
    router.push(`/kelas/${classId}/jadwal`);
  }

  function goSessions() {
    router.push(`/kelas/${classId}/sesi`);
  }

  async function archive() {
    if (archiving) return;
    setArchiving(true);
    setArchiveError('');
    try {
      await getPracticumRepository().archiveClass(classId);
      setConfirmVisible(false);
      router.replace('/kelas');
    } catch (cause) {
      setArchiveError(practicumErrorMessage(cause));
      setConfirmVisible(false);
    } finally {
      setArchiving(false);
    }
  }

  return (
    <View style={styles.screen}>
      <PracticumHeader
        eyebrow="Asisten"
        title="Detail Kelas"
        subtitle="Informasi kelas praktikum dan tindakan pengelolaan."
        onBack={goBack}
      />

      <SyncStatusBanner error={syncError} fromCache={fromCache} onRetry={retrySync} />

      {status === 'loading' ? <LoadingState message="Memuat kelas…" /> : null}

      {status === 'error' ? (
        <ErrorState message={error ?? 'Terjadi kesalahan.'} onRetry={reload} />
      ) : null}

      {status === 'missing' ? (
        <EmptyState
          title="Kelas tidak ditemukan"
          message="Kelas ini tidak tersedia atau sudah tidak dapat diakses."
          actionLabel="Kembali ke daftar"
          onAction={() => router.replace('/kelas')}
        />
      ) : null}

      {status === 'ready' && item ? (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>KELAS PRAKTIKUM</Text>
            <Text accessibilityRole="header" style={styles.title}>
              {item.className}
            </Text>
            <Text style={styles.course}>{item.courseName}</Text>
            <View style={styles.badgeRow}>
              <Badge
                label={item.archivedAt ? 'Diarsipkan' : 'Aktif'}
                tone={item.archivedAt ? 'neutral' : 'success'}
              />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ringkasan</Text>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Peserta</Text>
              <Text style={styles.rowValue}>{item.studentIds.length} orang</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Asisten</Text>
              <Text style={styles.rowValue}>{item.assistantIds.length} orang</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Status</Text>
              <Text style={styles.rowValue}>
                {item.archivedAt ? 'Diarsipkan' : 'Aktif'}
              </Text>
            </View>
          </View>

          {!item.archivedAt ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Kelola</Text>
              <View style={styles.linkRow}>
                <InlineAction label="Peserta" onPress={goParticipants} />
                <InlineAction label="Jadwal" onPress={goSchedules} />
                <InlineAction label="Sesi" onPress={goSessions} />
              </View>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tindakan</Text>
            <ActionButton title="Edit Kelas" secondary onPress={goEdit} />
            {item.archivedAt ? (
              <Text style={styles.note}>Kelas ini sudah diarsipkan.</Text>
            ) : (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Arsipkan kelas"
                  accessibilityState={{ disabled: archiving }}
                  disabled={archiving}
                  onPress={() => setConfirmVisible(true)}
                  style={({ pressed }) => [
                    styles.dangerButton,
                    pressed && styles.pressed,
                    archiving && styles.disabled,
                  ]}
                >
                  <Text style={styles.dangerLabel}>
                    {archiving ? 'Mengarsipkan…' : 'Arsipkan Kelas'}
                  </Text>
                </Pressable>
                <Text style={styles.note}>
                  Riwayat presensi dan izin tetap tersimpan saat kelas diarsipkan.
                </Text>
              </>
            )}
            {archiveError ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {archiveError}
              </Text>
            ) : null}
          </View>
        </ScrollView>
      ) : null}

      <ConfirmationModal
        visible={confirmVisible}
        eyebrow="KONFIRMASI ARSIP"
        title="Arsipkan kelas ini?"
        description={`Kelas ${item?.className ?? ''} akan diarsipkan. Riwayat presensi dan izin tetap tersimpan.`}
        confirmLabel="Arsipkan Kelas"
        onConfirm={() => {
          void archive();
        }}
        onCancel={() => setConfirmVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.8,
  },
  title: {
    color: colors.text,
    fontSize: typography.screenTitle,
    lineHeight: lineHeights.screenTitle,
    fontWeight: fontWeights.bold,
  },
  course: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: lineHeights.body,
  },
  badgeRow: { marginTop: spacing.xs },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.bodyLarge,
    fontWeight: fontWeights.bold,
  },
  linkRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowLabel: {
    color: colors.textMuted,
    fontSize: typography.body,
  },
  rowValue: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: fontWeights.semibold,
  },
  note: {
    color: colors.textMuted,
    fontSize: typography.secondary,
    lineHeight: lineHeights.body,
  },
  dangerButton: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  dangerLabel: {
    color: colors.danger,
    fontSize: typography.bodyLarge,
    fontWeight: fontWeights.semibold,
  },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.55 },
  error: {
    color: colors.danger,
    fontSize: typography.body,
    lineHeight: lineHeights.body,
  },
});
