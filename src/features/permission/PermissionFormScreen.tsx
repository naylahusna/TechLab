import { useRef, useState } from 'react';
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

export function PermissionFormScreen({ initialSessionId }: { initialSessionId?: string }) {
  const auth = useAuth();
  if (!auth.profile) return <Redirect href="/" />;
  if (auth.profile.role !== 'praktikan') return <Redirect href="/izin" />;
  return <FormContent key={auth.profile.uid} initialSessionId={initialSessionId} />;
}
function FormContent({ initialSessionId }: { initialSessionId?: string }) {
  const { profile } = useAuth();
  const router = useRouter();
  const overview = useScheduleOverview();
  const permissions = usePermissions();
  const [sessionId, setSessionId] = useState(initialSessionId ?? '');
  const [kind, setKind] = useState<PermissionKind>('sakit');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const guard = useRef(false);
  const sessions = overview.sessions.filter(
    (s) => s.studentIds.includes(profile!.uid) && (s.status === 'scheduled' || s.status === 'open'),
  );
  const selected = sessions.find((s) => s.id === sessionId);
  const existing = permissions.data.find((p) => p.sessionId === sessionId);
  const title =
    overview.schedules.find((s) => s.id === selected?.scheduleId)?.title ?? 'Pilih sesi';
  function preview() {
    setError('');
    try {
      if (!selected) throw new Error('Pilih sesi praktikum yang tersedia.');
      if (existing) throw new Error('Kamu sudah memiliki pengajuan untuk sesi ini.');
      validateSubmission(reason, kind);
      setConfirm(true);
    } catch (cause) {
      setError(permissionError(cause));
    }
  }
  async function submit() {
    if (guard.current || !profile || !selected) return;
    guard.current = true;
    setBusy(true);
    setConfirm(false);
    setError('');
    try {
      const id = await getPermissionRepository().submit(profile, {
        sessionId,
        reason,
        kind,
        aiConsent: false,
      });
      router.replace({ pathname: '/izin/[id]', params: { id, created: '1' } });
    } catch (cause) {
      setError(permissionError(cause));
    } finally {
      guard.current = false;
      setBusy(false);
    }
  }
  return (
    <View style={ui.screen}>
      <PracticumHeader
        title="Buat pengajuan izin."
        eyebrow="Praktikan · Izin"
        subtitle="Jelaskan halanganmu. Keputusan tetap di tangan asisten."
        onBack={() => {
          if (!busy) router.back();
        }}
      />
      <ScrollView contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled">
        <InfoCard label="01 / PILIH SESI" tone="lime">
          <Text style={ui.copy}>
            Izin dikaitkan ke satu sesi yang kamu ikuti. Sesi ditutup atau dibatalkan tidak menerima
            pengajuan baru.
          </Text>
          {overview.status === 'loading' && <LoadingState message="Memuat sesi yang kamu ikuti…" />}
          {overview.status === 'error' && (
            <ErrorState message={overview.error!} onRetry={overview.reload} />
          )}
          {overview.status === 'ready' && sessions.length === 0 && (
            <EmptyState
              title="Belum ada sesi yang tersedia"
              message="Pastikan kamu terdaftar pada kelas dan sesi belum ditutup."
            />
          )}
          {sessions.map((s) => (
            <ChoiceChip
              key={s.id}
              disabled={busy}
              label={`${overview.schedules.find((item) => item.id === s.scheduleId)?.title ?? 'Sesi praktikum'} · ${overview.classes.find((item) => item.id === s.classId)?.className ?? ''} · ${dateTime(s.startAt)}`}
              selected={sessionId === s.id}
              onPress={() => {
                setSessionId(s.id);
                setError('');
              }}
            />
          ))}
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
        <InfoCard label="KLASIFIKASI AI" tone="lavender">
          <Text style={ui.heading}>Ditinjau manusia, dibantu teknologi.</Text>
          <Text style={ui.copy}>
            Integrasi API AI pengajar belum diaktifkan. Alasanmu belum dikirim ke layanan AI. Kamu
            tetap bisa mengajukan izin untuk diperiksa asisten secara manual.
          </Text>
        </InfoCard>
        {permissions.status === 'error' && (
          <ErrorState message={permissions.error!} onRetry={permissions.retry} />
        )}
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
          disabled={busy || !!existing || !selected || permissions.status !== 'ready'}
          onPress={preview}
        />
        <Text style={ui.meta}>
          Status awal: Menunggu. Pengajuan tidak otomatis disetujui berdasarkan jenis atau alasan
          izin.
        </Text>
      </ScrollView>
      <ConfirmationModal
        visible={confirm}
        eyebrow="KONFIRMASI PENGAJUAN"
        title="Kirim pengajuan ini?"
        description={`${profile?.name} · ${profile?.number}\n${title}\n${selected ? dateTime(selected.startAt) : ''}\n${permissionKinds[kind]}\n\n${reason.trim()}\n\nStatus awal akan menjadi Menunggu.`}
        confirmLabel="Ya, kirim pengajuan"
        onConfirm={() => {
          void submit();
        }}
        onCancel={() => setConfirm(false)}
        confirmTestID="permission-confirm-submit"
      />
    </View>
  );
}
