import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '../../../components/Text';
import { AssistantBadge } from '../components/AssistantBadge';
import { AssistantButton } from '../components/AssistantButton';
import { AssistantEmptyState } from '../components/AssistantEmptyState';
import { AttendanceFilterChips } from '../components/AttendanceFilterChips';
import { AttendanceSummaryCard } from '../components/AttendanceSummaryCard';
import { ParticipantCard } from '../components/ParticipantCard';
import { SessionActionModal } from '../components/SessionActionModal';
import {
  filterParticipants,
  getSessionStatusTone,
} from '../lib/assistant-mapping';
import {
  colors,
  fontWeights,
  lineHeights,
  radius,
  spacing,
  typography,
} from '../theme';
import type {
  AssistantSessionItem,
  AttendanceFilter,
  AttendanceSummary,
  ParticipantItem,
} from '../types';

type AssistantSessionDetailScreenProps = {
  session: AssistantSessionItem;
  summary: AttendanceSummary;
  participants: ParticipantItem[];
  onBack: () => void;
  onOpenSession: () => { ok: boolean; message?: string } | Promise<{ ok: boolean; message?: string }>;
  onCloseSession: () => { ok: boolean; message?: string } | Promise<{ ok: boolean; message?: string }>;
};

export function AssistantSessionDetailScreen({
  session,
  summary,
  participants,
  onBack,
  onOpenSession,
  onCloseSession,
}: AssistantSessionDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<AttendanceFilter>('semua');
  const [modalAction, setModalAction] = useState<'open' | 'close' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredParticipants = filterParticipants(participants, filter);
  const tone = getSessionStatusTone(session.status);

  function handleOpenModal(action: 'open' | 'close') {
    setActionError(null);
    setModalAction(action);
  }

  function handleCloseModal() {
    if (!isSubmitting) {
      setModalAction(null);
      setActionError(null);
    }
  }

  async function handleConfirmAction() {
    if (!modalAction || isSubmitting) return;

    setIsSubmitting(true);
    setActionError(null);

    try {
      const result =
        modalAction === 'open'
          ? await onOpenSession()
          : await onCloseSession();

      if (result.ok) {
        setModalAction(null);
      } else {
        setActionError(result.message || 'Tindakan tidak dapat diproses.');
      }
    } catch {
      setActionError('Terjadi kesalahan saat memproses tindakan sesi.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kembali ke jadwal"
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Text style={styles.backLabel}>← Kembali ke Jadwal</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.meeting}>{session.meetingLabel}</Text>
          <Text style={styles.title}>{session.practicalName}</Text>
          <View style={styles.badgeRow}>
            <AssistantBadge label={session.statusLabel} tone={tone} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informasi Sesi</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Kelas</Text>
            <Text style={styles.infoValue}>{session.className}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Lab</Text>
            <Text style={styles.infoValue}>{session.lab}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tanggal</Text>
            <Text style={styles.infoValue}>{session.dateLabel}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Waktu</Text>
            <Text style={styles.infoValue}>{session.timeRangeLabel}</Text>
          </View>
          <View style={[styles.infoRow, styles.lastInfoRow]}>
            <Text style={styles.infoLabel}>Status Sesi</Text>
            <Text style={styles.infoValue}>{session.statusLabel}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pengelolaan Sesi</Text>
          {session.status === 'upcoming' ? (
            <View style={styles.actionSection}>
              <Text style={styles.actionHint}>
                Sesi belum dibuka. Buka sesi agar praktikan yang terdaftar dapat
                segera melakukan presensi kehadiran.
              </Text>
              <AssistantButton
                label="Buka Sesi Praktikum"
                variant="primary"
                onPress={() => handleOpenModal('open')}
                testID="btn-open-session"
              />
            </View>
          ) : session.status === 'open' ? (
            <View style={styles.actionSection}>
              <Text style={styles.actionHint}>
                Sesi sedang dibuka dan siap menerima presensi praktikan. Tutup
                sesi jika kegiatan praktikum telah selesai.
              </Text>
              <AssistantButton
                label="Tutup Sesi Praktikum"
                variant="danger"
                onPress={() => handleOpenModal('close')}
                testID="btn-close-session"
              />
            </View>
          ) : (
            <View style={styles.closedSection}>
              <View style={styles.closedBadge}>
                <Text style={styles.closedBadgeText}>SESI TELAH DITUTUP</Text>
              </View>
              <Text style={styles.closedHint}>
                Sesi praktikum telah ditutup secara permanen. Pembukaan ulang
                dinonaktifkan dan presensi baru tidak dapat dilakukan lagi.
              </Text>
            </View>
          )}
        </View>

        <AttendanceSummaryCard summary={summary} />

        <View style={styles.rekapSection}>
          <Text style={styles.sectionTitle}>Daftar Kehadiran Peserta</Text>

          {participants.length > 0 ? (
            <AttendanceFilterChips
              selected={filter}
              onSelect={setFilter}
              counts={{
                all: summary.total,
                present: summary.present,
                notPresent: summary.notPresent,
              }}
            />
          ) : null}

          {participants.length === 0 ? (
            <AssistantEmptyState kind="peserta" />
          ) : filteredParticipants.length === 0 ? (
            <AssistantEmptyState kind="filter" />
          ) : (
            <View style={styles.participantList}>
              {filteredParticipants.map((item) => (
                <ParticipantCard key={item.id} participant={item} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {modalAction ? (
        <SessionActionModal
          visible={true}
          action={modalAction}
          sessionName={session.practicalName}
          meetingLabel={session.meetingLabel}
          isSubmitting={isSubmitting}
          errorMessage={actionError}
          onConfirm={handleConfirmAction}
          onCancel={handleCloseModal}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  backLabel: {
    fontSize: typography.body,
    fontWeight: fontWeights.semibold,
    color: colors.link,
  },
  header: {
    gap: spacing.xs,
  },
  meeting: {
    fontSize: typography.secondary,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.primary,
  },
  title: {
    fontSize: typography.screenTitle,
    lineHeight: lineHeights.screenTitle,
    fontWeight: fontWeights.bold,
    color: colors.text,
  },
  badgeRow: {
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: fontWeights.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lastInfoRow: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  infoLabel: {
    fontSize: typography.body,
    color: colors.textMuted,
  },
  infoValue: {
    fontSize: typography.body,
    fontWeight: fontWeights.medium,
    color: colors.text,
  },
  actionSection: {
    gap: spacing.md,
  },
  actionHint: {
    fontSize: typography.body,
    lineHeight: lineHeights.body,
    color: colors.textMuted,
  },
  closedSection: {
    gap: spacing.sm,
  },
  closedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.neutralSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  closedBadgeText: {
    fontSize: typography.caption,
    fontWeight: fontWeights.bold,
    color: colors.neutral,
    letterSpacing: 0.6,
  },
  closedHint: {
    fontSize: typography.body,
    lineHeight: lineHeights.body,
    color: colors.textMuted,
  },
  rekapSection: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: fontWeights.bold,
    color: colors.text,
  },
  participantList: {
    gap: spacing.sm,
  },
});
