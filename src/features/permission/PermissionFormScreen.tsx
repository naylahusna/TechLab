import { useEffect, useRef, useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Text } from '../../components/Text';
import { ActionButton } from '../../components/ActionButton';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { useAuth } from '../auth/AuthProvider';
import { useScheduleOverview } from '../practicum';
import { PracticumHeader } from '../practicum/components/PracticumHeader';
import { ErrorState, LoadingState, EmptyState } from '../practicum/components/StateViews';
import { permissionError, validateSubmission, type PermissionKind } from './model';
import { getPermissionRepository, usePermissions } from './hooks';
import { dateTime, InfoCard, ui } from './ui';
import { useSubmissionAttendance } from './useSubmissionAttendance';
import { classifySavedPermission } from './classification-service';

type SubmissionPreview = {
  sessionId: string;
  reason: string;
  kind: PermissionKind;
  description: string;
  aiConsent: boolean;
};

export function PermissionFormScreen({ initialSessionId }: { initialSessionId?: string }) {
  const auth = useAuth();
  if (!auth.profile) return <Redirect href="/" />;
  if (auth.profile.role !== 'praktikan') return <Redirect href="/izin" />;
  return (
    <FormContent
      key={`${auth.profile.uid}:${initialSessionId ?? ''}`}
      initialSessionId={initialSessionId}
    />
  );
}
function FormContent({ initialSessionId }: { initialSessionId?: string }) {
  const { profile } = useAuth();
  const router = useRouter();
  const overview = useScheduleOverview();
  const permissions = usePermissions();
  const [sessionId, setSessionId] = useState(initialSessionId ?? '');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState<SubmissionPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [sessionPickerVisible, setSessionPickerVisible] = useState(false);
  const guard = useRef(false);
  const mounted = useRef(true);
  const sessions = overview.sessions.filter(
    (s) =>
      s.studentIds.includes(profile!.uid) &&
      s.status !== 'cancelled' &&
      overview.classes.some(
        (c) => c.id === s.classId && !c.archivedAt && c.studentIds.includes(profile!.uid),
      ) &&
      overview.schedules.some(
        (item) => item.id === s.scheduleId && item.classId === s.classId && !item.archivedAt,
      ),
  );
  const selected = sessions.find((s) => s.id === sessionId);
  const attendance = useSubmissionAttendance(selected?.id, profile!.uid);
  const existing = permissions.data.find((p) => p.sessionId === sessionId);
  const title =
    overview.schedules.find((s) => s.id === selected?.scheduleId)?.title ??
    'Pilih jadwal praktikum';
  const className = overview.classes.find((c) => c.id === selected?.classId)?.className ?? '';
  const isExpired = selected ? selected.endAt.toMillis() <= Date.now() : false;
  const isSelectable = (session: (typeof sessions)[number]) =>
    session.status !== 'closed' && session.status !== 'cancelled' && session.endAt.toMillis() > Date.now();
  const loading =
    overview.status === 'loading' || permissions.status === 'loading' ||
    (!!selected && attendance.status === 'loading');
  const connectionPending = overview.fromCache || permissions.cached || attendance.cached;
  const blocked =
    overview.status !== 'ready' || permissions.status !== 'ready' ||
    !!overview.syncError || connectionPending || (!!selected && attendance.status !== 'ready');
  const unavailable = sessionId && !selected && overview.status === 'ready'
    ? 'Jadwal pilihan tidak tersedia untuk izin. Pilih jadwal yang masih berlaku.'
    : selected && (selected.status === 'closed' || isExpired)
      ? 'Jadwal ini sudah ditutup atau kadaluarsa, sehingga pengajuan izin tidak tersedia.'
      : attendance.present
        ? 'Kamu sudah tercatat hadir pada sesi ini, sehingga tidak dapat mengajukan izin.'
        : existing
          ? 'Kamu sudah memiliki pengajuan untuk jadwal ini.'
          : '';

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  function preview() {
    setError('');
    try {
      if (blocked)
        throw new Error('Tunggu sampai data terbaru berhasil dimuat sebelum mengajukan izin.');
      if (!selected) throw new Error('Pilih jadwal praktikum yang masih berlaku.');
      if (unavailable) throw new Error(unavailable);
      // The category is intentionally neutral here; the AI result is the source
      // of classification shown after submission.
      const clean = validateSubmission(reason, 'lainnya');
      setConfirmation({
        sessionId: selected.id,
        ...clean,
        aiConsent: true,
        description: `${profile?.name} · ${profile?.number}\n${title}\n${className}\nMulai: ${dateTime(selected.startAt)}\nSelesai: ${dateTime(selected.endAt)}\nKlasifikasi: dianalisis AI setelah pengajuan\n\n${clean.reason}\n\nAnalisis AI akan berjalan otomatis setelah pengajuan tersimpan.\nStatus awal akan menjadi Menunggu.`,
      });
    } catch (cause) {
      setError(permissionError(cause));
    }
  }
  async function submit() {
    if (guard.current || !profile || !confirmation) return;
    if (blocked || unavailable || selected?.id !== confirmation.sessionId) {
      setConfirmation(null);
      setError(unavailable || 'Data sesi berubah. Periksa kembali pengajuanmu.');
      return;
    }
    guard.current = true;
    setBusy(true);
    setConfirmation(null);
    setError('');
    try {
      const id = await getPermissionRepository().submit(profile, {
        sessionId: confirmation.sessionId,
        reason: confirmation.reason,
        kind: confirmation.kind,
        aiConsent: confirmation.aiConsent,
      });
      if (confirmation.aiConsent) {
        // Saving permission succeeded first. A failed AI attempt never rolls it back.
        // The stored initial AI notice offers retry if this background attempt cannot start.
        void classifySavedPermission(id, profile).catch(() => {});
      }
      if (mounted.current) router.replace({ pathname: '/izin/[id]', params: { id, created: '1' } });
    } catch (cause) {
      if (mounted.current) setError(permissionError(cause));
    } finally {
      guard.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return (
    <View style={ui.screen}>
      <PracticumHeader
        title="Buat pengajuan izin."
        eyebrow="Praktikan · Izin"
        subtitle="Jelaskan halanganmu. Keputusan tetap di tangan asisten."
        onBack={() => {
          if (busy) return;
          if (router.canGoBack()) router.back();
          else router.replace('/izin');
        }}
      />
      <ScrollView contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled">
        <InfoCard label="PENGAJU">
          <Text style={ui.heading}>{profile?.name}</Text>
          <Text style={ui.copy}>NIM {profile?.number} · Praktikan</Text>
          <Text style={ui.meta}>Pengajuan akan disimpan atas nama akun yang sedang masuk.</Text>
        </InfoCard>
        {(connectionPending || overview.syncError) && (
          <InfoCard label="MENUNGGU KONEKSI" tone="peach">
            <Text accessibilityRole="alert" style={ui.copy}>
              {overview.syncError ||
                'Data terbaru belum dikonfirmasi server. Pengajuan belum dapat dikirim. Alasan yang kamu ketik tetap ada selama halaman ini terbuka.'}
            </Text>
            <ActionButton
              title="Periksa koneksi"
              secondary
              disabled={busy}
              onPress={() => {
                overview.retrySync();
                permissions.retry();
                attendance.retry();
              }}
            />
          </InfoCard>
        )}
        <InfoCard label="01 / PILIH JADWAL PRAKTIKUM" tone="lime">
          <Text style={ui.copy}>
            Pilih jadwal praktikum yang ingin kamu ajukan izinnya. Jadwal yang sudah ditutup atau
            kadaluarsa tidak dapat menerima pengajuan.
          </Text>
          {overview.status === 'loading' && <LoadingState message="Memuat sesi yang kamu ikuti…" />}
          {overview.status === 'error' && (
            <ErrorState message={overview.error!} onRetry={overview.reload} />
          )}
          {overview.status === 'ready' && sessions.length === 0 && (
            <EmptyState
              title="Belum ada sesi kelas"
              message="Pastikan kamu terdaftar pada kelas aktif yang memiliki sesi."
            />
          )}
          <ActionButton
            title={selected ? 'Ganti jadwal praktikum' : 'Pilih jadwal praktikum'}
            secondary
            disabled={busy || overview.status !== 'ready'}
            onPress={() => setSessionPickerVisible(true)}
          />
          {selected ? (
            <View style={styles.selectedSchedule}>
              <Text style={styles.selectedScheduleTitle}>
                {className} · {title}
              </Text>
              <Text style={ui.meta}>
                {dateTime(selected.startAt)} — {dateTime(selected.endAt)}
              </Text>
              <Text style={unavailable ? ui.error : ui.success}>
                {unavailable || 'Jadwal siap dipilih untuk pengajuan.'}
              </Text>
            </View>
          ) : (
            <Text style={ui.meta}>Belum ada jadwal yang dipilih.</Text>
          )}
          {!!unavailable && !existing && (
            <Text accessibilityRole="alert" style={ui.error}>
              {unavailable}
            </Text>
          )}
          {selected && attendance.status === 'error' && (
            <ErrorState message={attendance.error!} onRetry={attendance.retry} />
          )}
        </InfoCard>
        {selected && !unavailable ? <InfoCard label="02 / CERITAKAN ALASANMU">
          <Text style={ui.copy}>
            Tulis alasan ketidakhadiranmu secara lengkap. Kategori alasan akan diprediksi oleh AI
            sebagai informasi pendukung untuk pemeriksaan asisten.
          </Text>
          <TextInput
            accessibilityLabel="Alasan izin"
            placeholder="Contoh: Saya sedang sakit dan perlu beristirahat sesuai anjuran dokter…"
            multiline
            textAlignVertical="top"
            maxLength={2000}
            editable={!busy}
            style={[ui.input, { minHeight: 140 }]}
            value={reason}
            onChangeText={setReason}
          />
          <Text style={ui.meta}>
            {reason.trim().length}/2000 karakter · minimal 10 karakter. Hindari informasi pribadi
            yang tidak diperlukan.
          </Text>
        </InfoCard> : null}
        {selected && !unavailable ? (
          <InfoCard label="ANALISIS ALASAN · AI" tone="lavender">
            <Text style={ui.copy}>
              Setelah pengajuan tersimpan, AI akan menganalisis alasanmu secara otomatis sebagai
              informasi pendukung untuk pemeriksaan asisten.
            </Text>
            <Text style={ui.meta}>
              AI tidak menentukan izin diterima atau ditolak. Keputusan akhir tetap dilakukan oleh
              asisten.
            </Text>
          </InfoCard>
        ) : null}
        {permissions.status === 'error' && (
          <ErrorState message={permissions.error!} onRetry={permissions.retry} />
        )}
        {loading && <LoadingState message="Memeriksa sesi, status presensi, dan pengajuanmu…" />}
        {existing && (
          <InfoCard label="PENGAJUAN SUDAH ADA" tone="peach">
            <Text style={ui.copy}>
              Satu sesi hanya menerima satu pengajuan dari praktikan yang sama.
            </Text>
            <ActionButton
              title="Lihat status izin"
              secondary
              onPress={() => router.push(`/izin/${existing.id}`)}
            />
          </InfoCard>
        )}
        {!!error && (
          <Text accessibilityRole="alert" style={ui.error}>
            {error}
          </Text>
        )}
        <ActionButton
          title={busy ? 'Menyimpan pengajuan…' : 'Periksa & kirim pengajuan'}
          testID="permission-submit-preview"
          disabled={busy || blocked || !!unavailable || !selected}
          onPress={preview}
        />
        <Text style={ui.meta}>
          Status awal: Menunggu. Pengajuan tidak otomatis disetujui berdasarkan jenis atau alasan
          izin.
        </Text>
      </ScrollView>
      <ConfirmationModal
        visible={!!confirmation}
        eyebrow="KONFIRMASI PENGAJUAN"
        title={blocked || unavailable ? 'Pengajuan belum dapat dikirim' : 'Kirim pengajuan ini?'}
        description={
          blocked || unavailable
            ? `${unavailable || 'Data terbaru belum dapat dipastikan. Periksa koneksi dan coba lagi.'}\n\n${confirmation?.description ?? ''}`
            : confirmation?.description ?? ''
        }
        confirmLabel={blocked || unavailable ? 'Kembali ke formulir' : 'Ya, kirim pengajuan'}
        onConfirm={() => {
          void submit();
        }}
        onCancel={() => setConfirmation(null)}
        confirmTestID="permission-confirm-submit"
      />
      <Modal
        visible={sessionPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSessionPickerVisible(false)}
      >
        <View style={styles.pickerRoot}>
          <Pressable
            style={styles.pickerBackdrop}
            onPress={() => setSessionPickerVisible(false)}
          />
          <View style={styles.pickerCard}>
            <Text style={styles.pickerEyebrow}>PILIH JADWAL PRAKTIKUM</Text>
            <Text style={styles.pickerTitle}>Jadwal yang kamu ikuti</Text>
            <Text style={ui.meta}>
              Pilih jadwal yang masih berlaku untuk melanjutkan pengajuan izin.
            </Text>
            <ScrollView
              style={styles.pickerList}
              contentContainerStyle={styles.pickerListContent}
              showsVerticalScrollIndicator={false}
            >
              {sessions.map((session) => {
                const scheduleTitle =
                  overview.schedules.find((item) => item.id === session.scheduleId)?.title ??
                  'Jadwal praktikum';
                const sessionClass =
                  overview.classes.find((item) => item.id === session.classId)?.className ??
                  'Kelas praktikum';
                const available = isSelectable(session);
                const statusLabel = available
                  ? session.status === 'open'
                    ? 'Sedang dibuka'
                    : 'Belum dibuka'
                  : session.status === 'closed' || session.endAt.toMillis() <= Date.now()
                    ? 'Ditutup / kadaluarsa'
                    : 'Tidak tersedia';
                return (
                  <Pressable
                    key={session.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${sessionClass} ${scheduleTitle}`}
                    accessibilityState={{ disabled: !available, selected: session.id === sessionId }}
                    disabled={!available || busy}
                    onPress={() => {
                      setSessionId(session.id);
                      setError('');
                      setSessionPickerVisible(false);
                    }}
                    style={({ pressed }) => [
                      styles.scheduleOption,
                      session.id === sessionId && styles.scheduleOptionSelected,
                      !available && styles.scheduleOptionDisabled,
                      pressed && available && styles.scheduleOptionPressed,
                    ]}
                  >
                    <View style={styles.scheduleOptionCopy}>
                      <Text style={styles.scheduleOptionTitle}>
                        {sessionClass} · {scheduleTitle}
                      </Text>
                      <Text style={ui.meta}>
                        {dateTime(session.startAt)} — {dateTime(session.endAt)}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.scheduleOptionStatus,
                        !available && styles.scheduleOptionStatusDisabled,
                      ]}
                    >
                      {statusLabel}
                    </Text>
                  </Pressable>
                );
              })}
              {sessions.length === 0 && overview.status === 'ready' ? (
                <Text style={ui.meta}>Belum ada jadwal praktikum yang tersedia.</Text>
              ) : null}
            </ScrollView>
            <ActionButton
              title="Tutup"
              secondary
              onPress={() => setSessionPickerVisible(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  selectedSchedule: {
    gap: 6,
    borderWidth: 1,
    borderColor: '#CFE685',
    borderRadius: 18,
    backgroundColor: '#F6FFD1',
    padding: 16,
  },
  selectedScheduleTitle: {
    color: '#20251F',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '800',
  },
  pickerRoot: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  pickerBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#20251F80',
  },
  pickerCard: {
    maxHeight: '82%',
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 22,
    gap: 12,
  },
  pickerEyebrow: {
    color: '#4268E8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  pickerTitle: {
    color: '#20251F',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  pickerList: { maxHeight: 420 },
  pickerListContent: { gap: 10 },
  scheduleOption: {
    minHeight: 78,
    borderWidth: 1,
    borderColor: '#E5E8E0',
    borderRadius: 18,
    padding: 14,
    gap: 8,
    backgroundColor: '#F5F6F2',
  },
  scheduleOptionSelected: {
    borderColor: '#4268E8',
    backgroundColor: '#EDF1FF',
  },
  scheduleOptionDisabled: { opacity: 0.55 },
  scheduleOptionPressed: { opacity: 0.78 },
  scheduleOptionCopy: { gap: 3 },
  scheduleOptionTitle: {
    color: '#20251F',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
  },
  scheduleOptionStatus: {
    color: '#4268E8',
    fontSize: 12,
    fontWeight: '800',
  },
  scheduleOptionStatusDisabled: { color: '#A33030' },
});
