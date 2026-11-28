import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { ActionButton } from '../../components/ActionButton';
import { colors } from '../../theme/tokens';
import { useAuth } from './AuthProvider';
import { AuthForm } from './AuthForm';
import { applicationStatusLabels, isRestrictedRole } from '../../core/roles';
import { authErrorMessage, rejectionReasonLabels } from './model';

export function AuthBoundary({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [slowFor, setSlowFor] = useState<string | null>(null);
  const [logoutError, setLogoutError] = useState('');
  const [confirmContinuation, setConfirmContinuation] = useState(false);
  const [converting, setConverting] = useState(false);
  const [reapplying, setReapplying] = useState(false);
  const waiting =
    (auth.provisioning && !!auth.account) ||
    auth.status === 'loading' ||
    auth.status === 'profile-loading';
  const waitKey = `${auth.account?.uid ?? 'initial'}:${auth.status}`;
  const slow = slowFor === waitKey;
  useEffect(() => {
    if (!waiting) return;
    const timer = setTimeout(() => setSlowFor(waitKey), 12000);
    return () => clearTimeout(timer);
  }, [waiting, waitKey]);
  if (!auth.provisioning && auth.status === 'missing-profile') return <AuthForm mode="complete" />;
  if (waiting || auth.status === 'error')
    return (
      <View style={styles.page}>
        {waiting && (
          <ActivityIndicator color={colors.blue} size="large" accessibilityLabel="Memuat akun" />
        )}
        <Text style={styles.message}>
          {auth.error ||
            (slow
              ? 'Belum mendapat respons. Periksa koneksi internet kamu.'
              : 'Menyiapkan akun TechLab…')}
        </Text>
        {(slow || auth.status === 'error') && (
          <>
            <ActionButton title="Coba lagi" onPress={auth.retry} />
            {auth.account && (
              <ActionButton
                secondary
                title="Keluar"
                onPress={() => {
                  void auth.logout().catch((error) => setLogoutError(authErrorMessage(error)));
                }}
              />
            )}
            {!!logoutError && <Text accessibilityRole="alert">{logoutError}</Text>}
          </>
        )}
      </View>
    );
  if (auth.profile && isRestrictedRole(auth.profile.role)) {
    const reason = auth.profile.rejectionReason;
    const canContinue = auth.profile.role === 'asprak_ditolak' && reason === 'no_practitioner_account' && !auth.profile.reapplied;
    const canReapply = auth.profile.role === 'asprak_dicabut' || (auth.profile.role === 'asprak_ditolak' && auth.profile.reapplied);
    async function reapply() {
      setReapplying(true);
      setLogoutError('');
      try { await auth.reapplyAsAssistant(); }
      catch (error) { setLogoutError(authErrorMessage(error)); }
      finally { setReapplying(false); }
    }
    async function continueAccount() {
      setConfirmContinuation(false);
      setConverting(true);
      setLogoutError('');
      try {
        await auth.continueAsPractitioner();
      } catch (error) {
        setLogoutError(authErrorMessage(error));
      } finally {
        setConverting(false);
      }
    }
    return (
      <View style={styles.page}>
        <Text accessibilityRole="header" style={styles.message}>{applicationStatusLabels[auth.profile.role]}</Text>
        <Text style={styles.message}>
          {auth.profile.role === 'calon_asprak'
            ? 'Aslab akan meninjau identitas dan menentukan penugasan sebelum mengaktifkan akses Asprak.'
            : reason ? rejectionReasonLabels[reason] : 'Hubungi Aslab jika kamu perlu meninjau status akun asprak kamu.'}
        </Text>
        {auth.fromCache && (
          <Text style={styles.message}>Status tersimpan di perangkat. Sambungkan internet untuk mengecek keputusan terbaru.</Text>
        )}
        {canReapply && (
          <>
            <Text style={styles.message}>{auth.profile.name} · {auth.profile.number}{'\n'}{auth.account?.email}</Text>
            <ActionButton title={reapplying ? 'Mengirim…' : 'Ajukan kembali sebagai Asprak'}
              disabled={reapplying || auth.fromCache} onPress={() => void reapply()} />
          </>
        )}
        <ActionButton secondary title="Perbarui status" disabled={converting || reapplying} onPress={auth.retry} />
        {canContinue && (
          <>
            <ActionButton title={converting ? 'Memproses…' : 'Lanjut sebagai Praktikan'}
              disabled={converting || auth.fromCache} onPress={() => setConfirmContinuation(true)} />
            <ConfirmationModal
              visible={confirmContinuation}
              title="Lanjut sebagai Praktikan?"
              description="Email dan password akun ini tetap sama. Untuk mengajukan sebagai Asprak nanti, gunakan akun dan email berbeda."
              confirmLabel="Lanjut sebagai Praktikan"
              onConfirm={() => void continueAccount()}
              onCancel={() => setConfirmContinuation(false)}
            />
          </>
        )}
        <ActionButton secondary title="Keluar" disabled={converting || reapplying} onPress={() => {
          void auth.logout().catch((error) => setLogoutError(authErrorMessage(error)));
        }} />
        {!!logoutError && <Text accessibilityRole="alert">{logoutError}</Text>}
      </View>
    );
  }
  return children;
}
const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: 'center',
    padding: 32,
    gap: 20,
    backgroundColor: colors.background,
  },
  message: { color: colors.navy, textAlign: 'center', lineHeight: 22 },
});
