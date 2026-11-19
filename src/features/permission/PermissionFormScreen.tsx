import { useEffect, useRef, useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { ScrollView, TextInput, View } from 'react-native';
import { Text } from '../../components/Text';
import { ActionButton } from '../../components/ActionButton';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { useAuth } from '../auth/AuthProvider';
import { useScheduleOverview } from '../practicum';
import { PracticumHeader } from '../practicum/components/PracticumHeader';
import { ErrorState, LoadingState, EmptyState } from '../practicum/components/StateViews';
import { permissionError, permissionKinds, validateSubmission, type PermissionKind } from './model';
import { getPermissionRepository, usePermissions } from './hooks';
import { ChoiceChip, dateTime, InfoCard, ui } from './ui';
import { useSubmissionAttendance } from './useSubmissionAttendance';
import { classifySavedPermission } from './classification-service';
import { PermissionAiConsent } from './PermissionAiControls';

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
  const [kind, setKind] = useState<PermissionKind>('sakit');
  const [reason, setReason] = useState('');
  const [aiConsent, setAiConsent] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState<SubmissionPreview | null>(null);
  const [busy, setBusy] = useState(false);
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
    overview.schedules.find((s) => s.id === selected?.scheduleId)?.title ?? 'Pilih sesi';
  const className = overview.classes.find((c) => c.id === selected?.classId)?.className ?? '';
  const loading =
    overview.status === 'loading' || permissions.status === 'loading' ||
    (!!selected && attendance.status === 'loading');
  const connectionPending = overview.fromCache || permissions.cached || attendance.cached;
  const blocked =
    overview.status !== 'ready' || permissions.status !== 'ready' ||
    !!overview.syncError || connectionPending || (!!selected && attendance.status !== 'ready');
  const unavailable = sessionId && !selected && overview.status === 'ready'
    ? 'Sesi pilihan tidak tersedia untuk izin. Pilih sesi aktif yang kamu ikuti.'
    : attendance.present
      ? 'Kamu sudah tercatat hadir pada sesi ini, sehingga tidak dapat mengajukan izin.'
      : existing
        ? 'Kamu sudah memiliki pengajuan untuk sesi ini.'
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
      if (!selected) throw new Error('Pilih sesi praktikum yang tersedia.');
      if (unavailable) throw new Error(unavailable);
      const clean = validateSubmission(reason, kind);
      setConfirmation({
        sessionId: selected.id,
        ...clean,
        aiConsent,
        description: `${profile?.name} · ${profile?.number}\n${title}\n${className}\nMulai: ${dateTime(selected.startAt)}\nSelesai: ${dateTime(selected.endAt)}\n${permissionKinds[clean.kind]}\n\n${clean.reason}\n\nAnalisis AI eksternal: ${aiConsent ? 'disetujui' : 'tidak diminta'}.\nStatus awal akan menjadi Menunggu.`,
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
        <InfoCard label="01 / PILIH SESI" tone="lime">
          <Text style={ui.copy}>
            Izin dikaitkan ke satu sesi kelas yang kamu ikuti. Sesi yang belum dibuka, sedang dibuka,
            atau sudah ditutup tersedia untuk dipilih; sesi yang dibatalkan tidak menerima pengajuan.
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
          {sessions.map((s) => (
            <ChoiceChip
              key={s.id}
              disabled={busy}
              label={`${overview.classes.find((item) => item.id === s.classId)?.className ?? 'Kelas'} · ${overview.schedules.find((item) => item.id === s.scheduleId)?.title ?? 'Sesi praktikum'} · ${s.status === 'scheduled' ? 'Belum dibuka' : s.status === 'open' ? 'Sedang dibuka' : 'Sudah ditutup'} · ${dateTime(s.startAt)}`}
              selected={sessionId === s.id}
              onPress={() => {
                setSessionId(s.id);
                setError('');
              }}
            />
          ))}
          {selected && (
            <Text style={ui.meta}>
              Waktu sesi: {dateTime(selected.startAt)} — {dateTime(selected.endAt)}
            </Text>
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
        <InfoCard label="02 / CERITAKAN ALASANMU">
          <View style={ui.wrap}>
            {Object.entries(permissionKinds).map(([value, label]) => (
              <ChoiceChip
                key={value}
                disabled={busy}
                label={label}
                selected={kind === value}
                onPress={() => setKind(value as PermissionKind)}
              />
            ))}
          </View>
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
        </InfoCard>
        <PermissionAiConsent checked={aiConsent} onChange={setAiConsent} disabled={busy} />
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
    </View>
  );
}
