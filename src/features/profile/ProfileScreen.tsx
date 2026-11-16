import { useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import { ActionButton } from '../../components/ActionButton';
import { AppPage } from '../../components/AppPage';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { useAuth } from '../auth/AuthProvider';
import { FormField } from '../auth/AuthForm';
import { authErrorMessage } from '../auth/model';
import { colors } from '../../theme/tokens';
import type { Role } from '../../core/roles';

const roleLabel = (role: Role) => (role === 'asisten' ? 'Asprak' : 'Praktikan');

export function ProfileScreen() {
  const auth = useAuth();
  const router = useRouter();
  const [draft, setDraft] = useState<{ name: string; number: string } | null>(null);
  const name = draft?.name ?? auth.profile?.name ?? '';
  const number = draft?.number ?? auth.profile?.number ?? '';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [pendingRole, setPendingRole] = useState<Role | null>(null);
  if (!auth.profile) return <Redirect href="/" />;
  async function save() {
    if (busy) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await auth.saveProfile({ name, number });
      setDraft(null);
      setSuccess('Profil berhasil disimpan.');
    } catch (cause) {
      setError(authErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    if (busy) return;
    setBusy(true);
    setError('');
    setConfirmLogout(false);
    try {
      await auth.logout();
    } catch (cause) {
      setError(authErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }
  return (
    <AppPage title="Profil pengguna" subtitle="Kelola identitas akun TechLab kamu.">
      <View style={styles.card}>
        <Text style={styles.role}>Mode {roleLabel(auth.profile.role)}</Text>
        <Text style={styles.copy}>{auth.account?.email}</Text>
        <Text style={styles.copy}>
          Akses akun: {auth.profile.roles.map(roleLabel).join(' dan ')}.
        </Text>
        {auth.profile.roles.length > 1 &&
          auth.profile.roles.map((role) => (
            <ActionButton
              key={role}
              title={
                role === auth.profile?.role
                  ? `${roleLabel(role)} aktif`
                  : `Gunakan mode ${roleLabel(role)}`
              }
              disabled={busy || !!draft || role === auth.profile?.role}
              secondary
              testID={`switch-role-${role}`}
              onPress={() => {
                setError('');
                setPendingRole(role);
              }}
            />
          ))}
        {!!draft && auth.profile.roles.length > 1 && (
          <Text style={styles.copy}>Simpan perubahan profil sebelum berganti mode.</Text>
        )}
        <FormField
          label="Nama lengkap"
          value={name}
          onChangeText={(value) => {
            setDraft({ name: value, number });
            setSuccess('');
          }}
          editable={!busy}
        />
        <FormField
          label="NIM / ID"
          value={number}
          onChangeText={(value) => {
            setDraft({ name, number: value });
            setSuccess('');
          }}
          editable={!busy}
          maxLength={32}
        />
        <Text style={styles.copy}>
          Peran akun ditetapkan oleh pengelola. Email akun tidak diubah dari halaman profil.
        </Text>
        {auth.fromCache && (
          <Text style={styles.copy}>
            Menampilkan profil tersimpan. Perubahan memerlukan konfirmasi server.
          </Text>
        )}
        {!!error && (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        )}
        {!!success && (
          <Text accessibilityLiveRegion="polite" style={styles.success}>
            {success}
          </Text>
        )}
        <ActionButton
          title={busy ? 'Memproses…' : 'Simpan perubahan'}
          disabled={busy || !draft}
          onPress={() => {
            void save();
          }}
        />
        <ActionButton
          title="Keluar dari akun"
          secondary
          disabled={busy}
          onPress={() => setConfirmLogout(true)}
        />
      </View>
      <View style={[styles.card, { backgroundColor: colors.lime }]}>
        <Text style={styles.role}>Lab eksperimen</Text>
        <Text style={styles.copy}>
          Coba analisis sentimen komentar secara lokal. Model masih eksperimental dan terpisah
          dari pengajuan izin.
        </Text>
        <ActionButton
          title="Analisis Sentimen"
          testID="open-sentiment-analysis"
          onPress={() => router.push('/analisis-sentimen')}
        />
      </View>
      <ConfirmationModal
        visible={pendingRole !== null}
        title={`Gunakan mode ${roleLabel(pendingRole ?? 'praktikan')}?`}
        description="Akun dan riwayat kamu tetap sama. Menu akan mengikuti peran yang dipilih."
        confirmLabel="Ganti mode"
        confirmTestID="confirm-role-switch"
        cancelTestID="cancel-role-switch"
        onConfirm={() => {
          try {
            if (pendingRole) auth.selectRole(pendingRole);
          } catch (cause) {
            setError(authErrorMessage(cause));
          } finally {
            setPendingRole(null);
          }
        }}
        onCancel={() => setPendingRole(null)}
      />
      <ConfirmationModal
        visible={confirmLogout}
        title="Keluar dari TechLab?"
        description="Kamu perlu login kembali untuk mengakses akun."
        confirmLabel="Keluar"
        onConfirm={() => {
          void logout();
        }}
        onCancel={() => setConfirmLogout(false)}
      />
    </AppPage>
  );
}
const styles = StyleSheet.create({
  card: {
    padding: 24,
    borderRadius: 28,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 18,
  },
  role: { color: colors.navy, fontSize: 20, fontWeight: '800' },
  copy: { color: colors.muted, fontSize: 13, lineHeight: 21 },
  error: { color: colors.danger, lineHeight: 21 },
  success: { color: colors.success, lineHeight: 21 },
});
