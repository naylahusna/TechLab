import { Redirect } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ActionButton } from '../../components/ActionButton';
import { AppPage } from '../../components/AppPage';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { Text } from '../../components/Text';
import { roleLabels } from '../../core/roles';
import { colors } from '../../theme/tokens';
import { FormField } from '../auth/AuthForm';
import { useAuth } from '../auth/AuthProvider';
import { authErrorMessage, rejectionReasonLabels, type UserProfile } from '../auth/model';
import { changeUserRole, listAssignmentClasses, watchUsers, type RoleChange } from './users';

const filters = [
  { value: 'semua', label: 'Semua' },
  { value: 'calon_asprak', label: 'Menunggu' },
  { value: 'asisten', label: 'Asprak aktif' },
  { value: 'riwayat', label: 'Riwayat' },
] as const;
type Filter = typeof filters[number]['value'];

function availableActions({ role, rejectionReason }: UserProfile) {
  if (role === 'calon_asprak') return [
    { label: 'Setujui pengajuan', nextRole: 'asisten' },
    { label: 'Tolak: belum punya akun Praktikan', nextRole: 'asprak_ditolak', rejectionReason: 'no_practitioner_account' },
    { label: 'Tolak: alasan lain', nextRole: 'asprak_ditolak', rejectionReason: 'other' },
  ] as const;
  if (role === 'asprak_ditolak' && !rejectionReason) {
    return [{ label: 'Catat belum punya akun Praktikan', nextRole: 'asprak_ditolak', rejectionReason: 'no_practitioner_account' }] as const;
  }
  if (role === 'asisten') return [{ label: 'Cabut penugasan Asprak', nextRole: 'asprak_dicabut' }] as const;
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
  const [assignment, setAssignment] = useState<{
    change: RoleChange;
    classes: { id: string; label: string }[];
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const writing = useRef(false);
  const [loadError, setLoadError] = useState('');
  const [feedback, setFeedback] = useState<Record<string, { message: string; error: boolean }>>({});
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
  const filtered = users?.filter((user) => {
    const historical = user.role === 'asprak_ditolak' || user.role === 'asprak_dicabut';
    const matchesFilter = filter === 'semua' ? !historical
      : filter === 'riwayat' ? historical : user.role === filter;
    return matchesFilter
      && (user.name.toLowerCase().includes(needle) || user.number.toLowerCase().includes(needle));
  });
  const currentTarget = users?.find(({ uid }) => uid === pending?.user.uid);

  async function prepare(change: RoleChange) {
    if (writing.current || fromCache) return;
    if (change.nextRole === 'asprak_ditolak') {
      setPending(change);
      return;
    }
    writing.current = true;
    setBusy(true);
    setAssignment(null);
    try {
      const classes = await listAssignmentClasses(change.user, change.nextRole);
      if (!classes.length) {
        throw new Error(change.nextRole === 'asisten' ? 'Belum ada kelas aktif dalam cakupanmu.'
          : 'Asprak ini tidak memiliki penugasan kelas aktif dalam cakupanmu.');
      }
      setAssignment({
        change,
        classes: classes.map((item) => ({ id: item.id, label: `${item.courseName} · ${item.className}` })),
      });
    } catch (error) {
      setFeedback((previous) => ({ ...previous, [change.user.uid]: { message: authErrorMessage(error), error: true } }));
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }

  async function confirm() {
    if (!pending || writing.current || fromCache || currentTarget?.role !== pending.user.role) return;
    writing.current = true;
    setBusy(true);
    setPending(null);
    setFeedback((previous) => ({ ...previous, [pending.user.uid]: { message: 'Memproses perubahan…', error: false } }));
    try {
      const role = await changeUserRole(pending);
      const message = pending.nextRole === 'asprak_dicabut' && role === 'asisten'
        ? 'Penugasan ini dicabut. Penugasan di kelas lain tetap aktif.'
        : role === 'asprak_dicabut' ? 'Penugasan terakhir dan akses Asprak sudah dicabut.'
          : role === 'asisten' ? 'Pengajuan disetujui dan penugasan aktif.' : 'Status pengajuan diperbarui.';
      setFeedback((previous) => ({ ...previous, [pending.user.uid]: { message, error: false } }));
    } catch (error) {
      setFeedback((previous) => ({ ...previous, [pending.user.uid]: { message: authErrorMessage(error), error: true } }));
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
      {filtered?.length === 0 && <Text>{filter === 'riwayat' ? 'Riwayat penolakan dan pencabutan masih kosong.' : 'Tidak ada pengguna yang cocok.'}</Text>}
      {filtered?.map((user) => (
        <View key={user.uid} style={styles.card}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.detail}>{user.number} · {roleLabels[user.role]}</Text>
          {user.rejectionReason && <Text style={styles.detail}>{rejectionReasonLabels[user.rejectionReason]}</Text>}
          {feedback[user.uid] && (
            <View accessibilityLiveRegion="polite" style={[styles.feedback, feedback[user.uid].error && styles.feedbackError]}>
              {feedback[user.uid].error && <Text style={styles.error}>Perubahan akses gagal</Text>}
              <Text accessibilityRole={feedback[user.uid].error ? 'alert' : undefined}
                style={feedback[user.uid].error ? styles.error : styles.success}>
                {user.name} ({user.number}) · {feedback[user.uid].message}
              </Text>
            </View>
          )}
          {availableActions(user).map((action) => (
            <ActionButton key={action.label} title={action.label} secondary disabled={busy || fromCache}
              onPress={() => void prepare({ user, nextRole: action.nextRole,
                rejectionReason: 'rejectionReason' in action ? action.rejectionReason : undefined })} />
          ))}
          {assignment?.change.user.uid === user.uid && assignment.change.user.role === user.role && (
            <>
              <Text style={styles.detail}>{assignment.change.nextRole === 'asisten'
                ? 'Pilih kelas untuk penugasan baru.' : 'Pilih kelas yang penugasannya akan dicabut.'}</Text>
              {assignment.classes.map(({ id, label }) => (
                <ActionButton key={id} title={label} secondary disabled={busy || fromCache}
                  onPress={() => {
                    setPending({ ...assignment.change, classId: id, classLabel: label });
                    setAssignment(null);
                  }} />
              ))}
              <ActionButton title="Batal pilih kelas" secondary onPress={() => setAssignment(null)} />
            </>
          )}
        </View>
      ))}
      <ConfirmationModal
        visible={pending !== null && !fromCache && currentTarget?.role === pending.user.role}
        title="Konfirmasi perubahan akses"
        description={pending ? `${pending.user.name} (${pending.user.number}) · ${pending.classLabel ?? roleLabels[pending.nextRole]}. ${pending.nextRole === 'asisten' ? 'Akses kelas aktif setelah pengajuan disetujui.' : pending.nextRole === 'asprak_dicabut' ? 'Akses pada kelas ini akan dicabut.' : pending.rejectionReason ? rejectionReasonLabels[pending.rejectionReason] : ''}` : ''}
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
  feedback: { padding: 10, gap: 4, borderRadius: 10, backgroundColor: colors.background },
  feedbackError: { borderWidth: 1, borderColor: colors.danger },
  error: { color: colors.danger },
  success: { color: colors.success },
});
