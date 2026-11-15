import { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, TextInput, View } from 'react-native';
import { ActionButton } from '../../components/ActionButton';
import { Text } from '../../components/Text';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { useAuth } from '../auth/AuthProvider';
import { PracticumHeader } from '../practicum/components/PracticumHeader';
import { EmptyState, ErrorState, LoadingState } from '../practicum/components/StateViews';
import { getPermissionRepository, usePermission } from './hooks';
import { permissionError, permissionKinds, permissionLabels, validateDecision } from './model';
import { AiInformation, dateTime, InfoCard, PermissionBadge, ui } from './ui';
import { PermissionAiRetry } from './PermissionAiControls';

export function PermissionDetailScreen({ id, created = false }: { id: string; created?: boolean }) {
  const { profile } = useAuth();
  const router = useRouter();
  const resource = usePermission(id);
  const [reason, setReason] = useState('');
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null);
  const [busy, setBusy] = useState(false);
  const guard = useRef(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const item = resource.data;
  const assistant = profile?.role === 'asisten';
  function choose(value: 'approved' | 'rejected') {
    setError('');
    try {
      validateDecision(value, reason);
      setDecision(value);
    } catch (cause) {
      setError(permissionError(cause));
    }
  }
  async function decide() {
    if (guard.current || !profile || !decision) return;
    guard.current = true;
    setBusy(true);
    setError('');
    const target = decision;
    setDecision(null);
    try {
      await getPermissionRepository().decide(id, profile, target, reason);
      setSuccess(
        'Keputusan berhasil disimpan. Praktikan dapat melihat pembaruannya secara langsung.',
      );
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
        title="Detail pengajuan."
        eyebrow={assistant ? 'Asisten · Tinjauan izin' : 'Praktikan · Status izin'}
        subtitle="Satu pengajuan, satu keputusan yang tercatat."
        onBack={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/izin');
        }}
      />
      <ScrollView contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled">
        {resource.status === 'loading' && <LoadingState message="Memuat pengajuan…" />}
        {resource.status === 'error' && (
          <ErrorState message={resource.error!} onRetry={resource.retry} />
        )}
        {resource.status === 'ready' && !item && (
          <EmptyState
            title="Pengajuan tidak ditemukan"
            message="Pengajuan ini tidak tersedia. Kembali ke daftar izin."
          />
        )}
        {resource.cached && (
          <View style={ui.notice}>
            <Text style={ui.copy}>
              Data tersimpan sedang ditampilkan. Status terbaru belum dikonfirmasi server. Keputusan
              memerlukan koneksi internet.
            </Text>
          </View>
        )}
        {resource.status === 'ready' && item && (
          <>
            {created && (
              <InfoCard label="PENGAJUAN TERKIRIM" tone="lime">
                <Text accessibilityLiveRegion="polite" style={ui.success}>
                  Izin berhasil tersimpan. Pantau keputusan asisten di halaman ini.
                </Text>
              </InfoCard>
            )}
            <InfoCard label="PENGAJUAN IZIN">
              <View style={ui.row}>
                <Text style={[ui.heading, { flex: 1 }]}>{item.sessionTitle}</Text>
                <PermissionBadge status={item.status} />
              </View>
              <Text style={ui.copy}>
                {item.className} · {dateTime(item.sessionStartAt)}
              </Text>
              <Text style={ui.heading}>{item.studentName}</Text>
              <Text style={ui.meta}>NIM {item.studentNumber}</Text>
              <Text style={ui.eyebrow}>{permissionKinds[item.kind]}</Text>
              <Text selectable style={ui.copy}>
                {item.reason}
              </Text>
              <Text style={ui.meta}>Diajukan {dateTime(item.createdAt)}</Text>
            </InfoCard>
            <AiInformation permission={item} />
            <PermissionAiRetry item={item} cached={resource.cached} />
            <InfoCard
              label="JEJAK PENGAJUAN"
              tone={
                item.status === 'approved' ? 'lime' : item.status === 'rejected' ? 'peach' : 'white'
              }
            >
              <Text style={ui.copy}>01 · Pengajuan dibuat — {dateTime(item.createdAt)}</Text>
              <Text style={ui.copy}>
                {item.status === 'pending'
                  ? '02 · Menunggu pemeriksaan asisten'
                  : `02 · ${permissionLabels[item.status]} — ${dateTime(item.decidedAt)}`}
              </Text>
              {item.decidedBy && (
                <Text style={ui.meta}>Keputusan dikonfirmasi oleh asisten kelas.</Text>
              )}
              {item.decisionReason && (
                <>
                  <Text style={ui.eyebrow}>CATATAN ASISTEN</Text>
                  <Text selectable style={ui.copy}>
                    {item.decisionReason}
                  </Text>
                </>
              )}
              <Text style={ui.meta}>
                Pengajuan dan keputusan disimpan di Firestore. Hasil AI tidak menentukan status
                persetujuan.
              </Text>
            </InfoCard>
            {assistant && item.status === 'pending' && (
              <InfoCard label="KEPUTUSAN ASISTEN">
                <Text style={ui.copy}>
                  Periksa alasan dan informasi pendukung. Penolakan wajib disertai alasan,
                  persetujuan dapat ditambahkan catatan.
                </Text>
                <TextInput
                  style={[ui.input, { minHeight: 100 }]}
                  textAlignVertical="top"
                  multiline
                  maxLength={1000}
                  accessibilityLabel="Catatan keputusan asisten"
                  placeholder="Tuliskan catatan atau alasan penolakan…"
                  editable={!busy}
                  value={reason}
                  onChangeText={setReason}
                />
                <ActionButton
                  title={busy ? 'Menyimpan keputusan…' : 'Setujui pengajuan'}
                  disabled={busy || resource.cached}
                  onPress={() => choose('approved')}
                  testID="permission-approve"
                />
                <ActionButton
                  title="Tolak pengajuan"
                  secondary
                  disabled={busy || resource.cached}
                  onPress={() => choose('rejected')}
                  testID="permission-reject"
                />
              </InfoCard>
            )}
            {!!success && (
              <Text accessibilityLiveRegion="polite" style={ui.success}>
                {success}
              </Text>
            )}
            {!!error && (
              <Text accessibilityRole="alert" style={ui.error}>
                {error}
              </Text>
            )}
            <ActionButton
              title="Kembali ke daftar izin"
              secondary
              onPress={() => router.replace('/izin')}
            />
          </>
        )}
      </ScrollView>
      <ConfirmationModal
        visible={!!decision}
        eyebrow="KEPUTUSAN FINAL ASISTEN"
        title={decision === 'approved' ? 'Setujui izin ini?' : 'Tolak izin ini?'}
        description={`${item?.studentName ?? ''}\n${item?.sessionTitle ?? ''}\n\n${reason.trim() || 'Tanpa catatan tambahan.'}\n\nKeputusan disimpan beserta waktu dan akun asisten. Tidak dapat diubah melalui aplikasi.`}
        confirmLabel="Konfirmasi keputusan"
        onConfirm={() => {
          void decide();
        }}
        onCancel={() => setDecision(null)}
        confirmTestID="permission-confirm-decision"
      />
    </View>
  );
}
