import { useState } from 'react';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { SelectionLayout } from '../../components/SelectionLayout';
import { Text } from '../../components/Text';
import { ActionButton } from '../../components/ActionButton';
import { colors } from '../../theme/tokens';
import { useAuth } from './AuthProvider';
import { authErrorMessage } from './model';

export function FormField({
  label,
  value,
  onChangeText,
  password = false,
  email = false,
  editable = true,
  maxLength = 100,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  password?: boolean;
  email?: boolean;
  editable?: boolean;
  maxLength?: number;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        secureTextEntry={password}
        autoCapitalize={email || password ? 'none' : 'words'}
        autoCorrect={!email && !password}
        keyboardType={email ? 'email-address' : 'default'}
        autoComplete={email ? 'email' : password ? 'current-password' : 'off'}
        maxLength={maxLength}
        style={styles.input}
      />
    </View>
  );
}

export function AuthForm({ mode }: { mode: 'login' | 'register' | 'complete' }) {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const register = mode === 'register';
  const complete = mode === 'complete';
  async function submit() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (register && password !== confirmation)
        throw new Error('Konfirmasi password tidak sesuai.');
      if (complete) await auth.completeProfile({ name, number });
      else if (register) await auth.register(email, password, { name, number });
      else await auth.login(email, password);
    } catch (cause) {
      setError(authErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }
  return (
    <SelectionLayout
      title={
        complete
          ? 'Satu langkah lagi.'
          : register
            ? 'Mulai perjalananmu.'
            : 'Selamat datang kembali.'
      }
      subtitle={
        complete
          ? 'Lengkapi profil agar kegiatan praktikum terhubung dengan akunmu.'
          : register
            ? 'Buat akun praktikan dan ikuti kegiatan kelasmu.'
            : 'Masuk untuk melanjutkan kegiatan praktikum kamu.'
      }
      eyebrow={complete ? 'PROFIL AKUN' : register ? 'BUAT AKUN TECHLAB' : 'MASUK KE TECHLAB'}
      storyTitle={'Praktikum rapi.\nSemua terhubung.'}
      storyDescription="Jadwal, presensi, dan pengajuan izin dalam satu ruang. Terhubung untuk praktikan dan asisten."
      footer="Akun dilindungi Firebase Authentication. Peran ditetapkan oleh pengelola."
    >
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.copy}>
            {complete
              ? `Akun ${auth.account?.email ?? ''} sudah tersedia. Lengkapi profil untuk melanjutkan.`
              : 'Kelola kegiatan praktikum dengan akun TechLab kamu.'}
          </Text>
          {(register || complete) && (
            <>
              <FormField
                label="Nama lengkap"
                value={name}
                onChangeText={setName}
                editable={!busy}
              />
              <FormField
                label="NIM / ID"
                value={number}
                onChangeText={setNumber}
                editable={!busy}
                maxLength={32}
              />
              <Text style={styles.copy}>
                Akun baru mendapat akses Praktikan. Petugas dapat menambahkan akses Asprak pada akun
                yang sama.
              </Text>
            </>
          )}
          {!complete && (
            <>
              <FormField
                label="Email"
                value={email}
                onChangeText={setEmail}
                email
                editable={!busy}
                maxLength={254}
              />
              <FormField
                label="Password"
                value={password}
                onChangeText={setPassword}
                password
                editable={!busy}
                maxLength={4096}
              />
              {register && (
                <FormField
                  label="Konfirmasi password"
                  value={confirmation}
                  onChangeText={setConfirmation}
                  password
                  editable={!busy}
                  maxLength={4096}
                />
              )}
            </>
          )}
          {!!(error || auth.actionError) && (
            <Text accessibilityRole="alert" style={styles.error}>
              {error || auth.actionError}
            </Text>
          )}
          <ActionButton
            title={busy ? 'Memproses…' : complete ? 'Simpan profil' : register ? 'Daftar' : 'Masuk'}
            disabled={busy}
            onPress={() => {
              void submit();
            }}
          />
          {!complete && (
            <ActionButton
              secondary
              disabled={busy}
              title={register ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}
              onPress={() => router.replace(register ? '/' : '/register')}
            />
          )}
          {complete && (
            <ActionButton
              secondary
              disabled={busy}
              title="Keluar"
              onPress={() => {
                setError('');
                void auth.logout().catch((cause) => setError(authErrorMessage(cause)));
              }}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SelectionLayout>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: {
    width: '100%',
    alignSelf: 'center',
    gap: 18,
    backgroundColor: colors.white,
  },
  brand: { color: colors.blue, fontSize: 28, fontWeight: '800' },
  title: { color: colors.navy, fontSize: 23, fontWeight: '800' },
  copy: { color: colors.muted, fontSize: 13, lineHeight: 21 },
  field: { gap: 8 },
  label: { color: colors.navy, fontSize: 13, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 14,
    minHeight: 50,
    fontSize: 16,
    color: colors.navy,
    backgroundColor: colors.background,
    fontFamily: 'Nunito',
  },
  error: { color: colors.danger, lineHeight: 21 },
});
