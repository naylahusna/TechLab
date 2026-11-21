import { Redirect } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ActionButton } from '../../components/ActionButton';
import { AppPage } from '../../components/AppPage';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { Text } from '../../components/Text';
import { roleLabels, type Role } from '../../core/roles';
import { colors } from '../../theme/tokens';
import { FormField } from '../auth/AuthForm';
import { useAuth } from '../auth/AuthProvider';
import { authErrorMessage, type UserProfile } from '../auth/model';
import { changeUserRole, watchUsers, type RoleChange } from './users';

const filters = [
  { value: 'semua', label: 'Semua' },
  { value: 'calon_asprak', label: 'Menunggu' },
  { value: 'asisten', label: 'Asprak aktif' },
] as const;
type Filter = typeof filters[number]['value'];

function availableActions(role: Role) {
  if (role === 'calon_asprak') return [
    { label: 'Setujui pengajuan', nextRole: 'asisten' },
    { label: 'Tolak pengajuan', nextRole: 'asprak_ditolak' },
  ] as const;
  if (role === 'asisten') return [{ label: 'Cabut akses asprak', nextRole: 'asprak_dicabut' }] as const;
  return [];
}

export function AdminUsersScreen() {
  const { profile } = useAuth();
  if (!profile) return <Redirect href="/" />;
  if (profile.role !== 'admin') return <Redirect href="/jadwal" />;
  return <UserDirectory key={profile.uid} />;
}

function UserDirectory() {
  const [users, setUsers] = useState<UserProfile[] | null>(null);
  const [fromCache, setFromCache] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('semua');
  const [pending, setPending] = useState<RoleChange | null>(null);
  const [busy, setBusy] = useState(false);
  const writing = useRef(false);
  const [loadError, setLoadError] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; error: boolean } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => watchUsers((accounts, cached) => {
    setLoadError('');
    setUsers(accounts);
    setFromCache(cached);
  }, (error) => {
    setUsers(null);
    setLoadError(authErrorMessage(error));
  }), [attempt]);

  const needle = query.trim().toLowerCase();
  const filtered = users?.filter((user) =>
    (filter === 'semua' || user.role === filter) &&
    (user.name.toLowerCase().includes(needle) || user.number.toLowerCase().includes(needle)),
  );
  const currentTarget = users?.find(({ uid }) => uid === pending?.user.uid);

  async function confirm() {
    if (!pending || writing.current || fromCache || currentTarget?.role !== pending.user.role) return;
    writing.current = true;
    setBusy(true);
    setPending(null);
    setFeedback(null);
    try {
      await changeUserRole(pending);
      setFeedback({ message: `Status akun ${pending.user.name} diperbarui.`, error: false });
    } catch (error) {
      setFeedback({ message: authErrorMessage(error), error: true });
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }

  return (
    <AppPage title="Kelola pengguna" subtitle="Tinjau pengajuan dan kelola akses asprak TechLab.">
      <View style={styles.card}>
        <FormField label="Cari nama atau NIM / ID" value={query} onChangeText={setQuery} />
        <View style={styles.filters}>
          {filters.map(({ value, label }) => (
            <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: value === filter }}
              onPress={() => setFilter(value)} style={[styles.filter, value === filter && styles.selected]}>
              <Text style={styles.label}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      {!!loadError && (
        <View style={styles.card}>
          <Text accessibilityRole="alert" style={styles.error}>{loadError}</Text>
          <ActionButton title="Muat ulang" secondary onPress={() => {
            setLoadError('');
            setAttempt((value) => value + 1);
          }} />
        </View>
      )}
      {!loadError && users === null && <Text>Memuat pengguna…</Text>}
      {users !== null && fromCache && <Text>Menunggu data server untuk mengubah peran.</Text>}
      {feedback && (
        <Text accessibilityRole={feedback.error ? 'alert' : undefined} accessibilityLiveRegion="polite"
          style={feedback.error ? styles.error : styles.success}>
          {feedback.message}
        </Text>
      )}
      {filtered?.length === 0 && <Text>Tidak ada pengguna yang cocok.</Text>}
      {filtered?.map((user) => (
        <View key={user.uid} style={styles.card}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.detail}>{user.number} · {roleLabels[user.role]}</Text>
          {availableActions(user.role).map(({ label, nextRole }) => (
            <ActionButton key={nextRole} title={label} secondary disabled={busy || fromCache}
              onPress={() => setPending({ user, nextRole })} />
          ))}
        </View>
      ))}
      <ConfirmationModal
        visible={pending !== null && !fromCache && currentTarget?.role === pending.user.role}
        title="Konfirmasi perubahan akses"
        description={pending ? `${pending.user.name} (${pending.user.number}) · ${roleLabels[pending.nextRole]}. ${pending.nextRole === 'asisten' ? 'Pastikan pengajuan ini milik pemilik akun praktikan dengan nama dan NIM yang sama.' : ''}` : ''}
        eyebrow="KONFIRMASI PERAN"
        confirmLabel="Konfirmasi"
        confirmTestID="confirm-role-change"
        onConfirm={() => void confirm()}
        onCancel={() => setPending(null)}
      />
    </AppPage>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10, borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, padding: 16 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filter: { borderRadius: 14, backgroundColor: colors.background, paddingHorizontal: 12, paddingVertical: 8 },
  selected: { backgroundColor: colors.lime },
  label: { color: colors.navy, fontWeight: '700' },
  name: { fontSize: 17, color: colors.navy, fontWeight: '800' },
  detail: { color: colors.muted },
  error: { color: colors.danger },
  success: { color: colors.success },
});
