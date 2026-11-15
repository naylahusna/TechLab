import { useState } from 'react';
import { Pressable } from 'react-native';
import { ActionButton } from '../../components/ActionButton';
import { Text } from '../../components/Text';
import { useAuth } from '../auth/AuthProvider';
import { permissionAiConfigured } from './ai';
import { classifySavedPermission } from './classification-service';
import { permissionError, type Permission } from './model';
import { InfoCard, ui } from './ui';

export function PermissionAiConsent({ checked, onChange, disabled }: {
  checked: boolean; onChange: (checked: boolean) => void; disabled: boolean;
}) {
  return (
    <InfoCard label="ANALISIS ALASAN · OPSIONAL" tone="lavender">
      <Text style={ui.heading}>Ditinjau manusia, dibantu AI.</Text>
      <Text style={ui.copy}>
        Jika kamu setuju, teks alasan akan dikirim ke penyedia AI eksternal untuk memprediksi
        kategori sakit, keluarga, kegiatan kampus, atau lainnya. Jangan sertakan nama, NIM,
        atau informasi pribadi yang tidak diperlukan dalam alasan.
      </Text>
      <Pressable
        testID="permission-ai-consent"
        accessibilityRole="checkbox"
        accessibilityLabel="Setuju alasan izin dianalisis oleh AI eksternal"
        accessibilityState={{ checked, disabled: disabled || !permissionAiConfigured }}
        aria-checked={checked}
        aria-disabled={disabled || !permissionAiConfigured}
        disabled={disabled || !permissionAiConfigured}
        style={ui.notice}
        onPress={() => onChange(!checked)}
      >
        <Text style={ui.heading}>{checked ? '☑' : '☐'} Saya setuju alasan izin dianalisis AI.</Text>
      </Pressable>
      <Text style={ui.meta}>
        {permissionAiConfigured
          ? 'Tanpa persetujuan, alasan tidak dikirim ke AI. Pengajuan tetap bisa diperiksa manual. Hasil AI tidak menerima atau menolak izin.'
          : 'Layanan AI belum dikonfigurasi. Pengajuan tetap bisa diperiksa secara manual.'}
      </Text>
    </InfoCard>
  );
}

export function PermissionAiRetry({ item, cached }: { item: Permission; cached: boolean }) {
  const { profile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  if (!profile || profile.uid !== item.userId || !item.aiConsent ||
      item.aiStatus === 'completed' || (item.status !== 'pending' && item.aiStatus !== 'processing')) return null;
  async function retry() {
    if (busy || !profile) return;
    setBusy(true); setMessage('');
    try {
      const started = await classifySavedPermission(item.id, profile);
      if (!started) setMessage('Analisis masih berjalan atau hasil sudah tersedia. Tunggu pembaruan status. Jika terhenti, coba lagi setelah satu menit.');
    } catch (error) { setMessage(permissionError(error)); }
    finally { setBusy(false); }
  }
  return (
    <InfoCard label="TINDAK LANJUT ANALISIS AI">
      <Text style={ui.copy}>
        Pengajuan tetap tersimpan meskipun analisis gagal. Kamu dapat mencoba lagi tanpa membuat
        pengajuan baru. Permintaan ulang dapat memakai kuota layanan AI.
      </Text>
      <ActionButton
        title={busy ? 'Menganalisis alasan…' : 'Coba analisis AI'}
        disabled={busy || cached || !permissionAiConfigured}
        testID="permission-ai-retry"
        onPress={() => { void retry(); }}
      />
      {!!message && <Text accessibilityRole="alert" style={ui.copy}>{message}</Text>}
    </InfoCard>
  );
}
