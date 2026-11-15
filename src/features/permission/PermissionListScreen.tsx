import { useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { Pressable, TextInput, View } from 'react-native';
import { AppPage } from '../../components/AppPage';
import { ActionButton } from '../../components/ActionButton';
import { Text } from '../../components/Text';
import { useAuth } from '../auth/AuthProvider';
import { EmptyState, ErrorState, LoadingState } from '../practicum/components/StateViews';
import { filterPermissions, permissionLabels, permissionStatusExplanation } from './model';
import { usePermissions } from './hooks';
import { ChoiceChip, dateTime, PermissionBadge, ui } from './ui';
import { colors } from '../../theme/tokens';

export function PermissionListScreen() {
  const { profile } = useAuth();
  if (!profile) return <Redirect href="/" />;
  return <PermissionListContent key={`${profile.uid}:${profile.role}`} />;
}

function PermissionListContent() {
  const router = useRouter();
  const { profile } = useAuth();
  const resource = usePermissions();
  const assistant = profile?.role === 'asisten';
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [classId, setClassId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const classes = [...new Map(resource.data.map((item) => [item.classId, item.className])).entries()];
  const sessions = [...new Map(resource.data.filter((item) => !classId || item.classId === classId)
    .map((item) => [item.sessionId, item.sessionTitle])).entries()];
  const items = filterPermissions(resource.data, filter, search, { classId, sessionId });
  return (
    <AppPage
      title={assistant ? 'Ruang pemeriksaan izin.' : 'Ada halangan? Kabari di sini.'}
      subtitle={
        assistant
          ? 'Tinjau alasan praktikan dan tentukan keputusanmu. AI hanya membantu, kamu yang memutuskan.'
          : 'Ajukan izin dan pantau keputusan asisten, tanpa harus menebak-nebak.'
      }
    >
      <View style={ui.wrap}>
        {(['pending', 'approved', 'rejected'] as const).map((status, index) => (
          <View
            key={status}
            style={[
              ui.stat,
              { backgroundColor: [colors.lavender, colors.lime, colors.peach][index] },
            ]}
          >
            <Text style={ui.statValue}>
              {resource.status === 'ready'
                ? resource.data.filter((item) => item.status === status).length
                : '—'}
            </Text>
            <Text style={ui.meta}>{permissionLabels[status]}</Text>
          </View>
        ))}
      </View>
      {!assistant && (
        <ActionButton
          title="+ Ajukan izin"
          onPress={() => router.push('/izin/new')}
          testID="permission-new"
        />
      )}
      <View style={ui.card}>
        <Text style={ui.eyebrow}>{assistant ? 'PENGAJUAN DARI KELASMU' : 'PENGAJUAN SAYA'}</Text>
        <TextInput
          accessibilityLabel="Cari pengajuan izin"
          placeholder={assistant ? 'Cari nama, NIM, kelas, atau sesi…' : 'Cari kelas atau sesi…'}
          style={ui.input}
          value={search}
          onChangeText={setSearch}
        />
        <View style={ui.wrap}>
          <ChoiceChip label="Semua" selected={filter === 'all'} onPress={() => setFilter('all')} />
          {Object.entries(permissionLabels).map(([value, label]) => (
            <ChoiceChip
              key={value}
              label={label}
              selected={filter === value}
              onPress={() => setFilter(value)}
            />
          ))}
        </View>
      </View>
      {assistant && resource.status === 'ready' && (
        <View style={ui.card}>
          <Text style={ui.eyebrow}>KELAS YANG MEMILIKI PENGAJUAN</Text>
          <View style={ui.wrap}>
            <ChoiceChip label="Semua kelas" selected={!classId} onPress={() => { setClassId(''); setSessionId(''); }} />
            {classes.map(([id, name]) => <ChoiceChip key={id} label={name} selected={classId === id}
              onPress={() => { setClassId(id); setSessionId(''); }} />)}
          </View>
          <Text style={ui.eyebrow}>SESI</Text>
          <View style={ui.wrap}>
            <ChoiceChip label="Semua sesi" selected={!sessionId} onPress={() => setSessionId('')} />
            {sessions.map(([id, title]) => <ChoiceChip key={id} label={title} selected={sessionId === id}
              onPress={() => setSessionId(id)} />)}
          </View>
        </View>
      )}
      <ActionButton title="Reset pencarian dan filter" secondary
        disabled={!search && filter === 'all' && !classId && !sessionId}
        onPress={() => { setSearch(''); setFilter('all'); setClassId(''); setSessionId(''); }} />
      {resource.status === 'ready' && <Text accessibilityLiveRegion="polite" style={ui.meta}>
        Menampilkan {items.length} dari {resource.data.length} pengajuan dalam cakupanmu.
      </Text>}
      {resource.status === 'loading' && <LoadingState message="Memuat pengajuan izin…" />}
      {resource.status === 'error' && (
        <ErrorState message={resource.error!} onRetry={resource.retry} />
      )}
      {resource.cached && resource.status === 'ready' && (
        <View style={ui.notice}>
          <Text style={ui.copy}>
            Menampilkan data tersimpan. Sambungkan internet untuk memastikan status terbaru;
            keputusan baru membutuhkan konfirmasi server.
          </Text>
        </View>
      )}
      {resource.status === 'ready' && items.length === 0 && (
        <EmptyState
          title={resource.data.length ? 'Tidak ada hasil yang cocok' : 'Belum ada pengajuan izin'}
          message={
            resource.data.length
              ? 'Coba ubah pencarian atau pilih status lain.'
              : assistant
                ? 'Pengajuan peserta dari kelas yang kamu tangani akan muncul di sini.'
                : 'Pengajuan yang kamu kirim akan tersimpan di sini beserta keputusan asisten.'
          }
        />
      )}
      {resource.status === 'ready' &&
        items.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`Detail izin ${item.studentName} ${item.sessionTitle}`}
            onPress={() => router.push(`/izin/${item.id}`)}
            style={({ pressed }) => [ui.card, pressed && { opacity: 0.8 }]}
          >
            <View style={ui.row}>
              <Text style={[ui.eyebrow, { flex: 1 }]}>{item.className}</Text>
              <PermissionBadge status={item.status} />
            </View>
            <Text style={ui.heading}>{item.sessionTitle}</Text>
            {assistant && (
              <Text style={ui.copy}>
                {item.studentName} · {item.studentNumber}
              </Text>
            )}
            <Text style={ui.copy} numberOfLines={2}>
              {item.reason}
            </Text>
            {!assistant && (
              <Text accessibilityLiveRegion="polite" style={ui.meta}>
                {permissionStatusExplanation(item.status, resource.cached)}
              </Text>
            )}
            {item.decisionReason && (
              <Text style={ui.copy} numberOfLines={3}>
                Catatan asisten: {item.decisionReason}
              </Text>
            )}
            {item.decidedAt && <Text style={ui.meta}>Diputuskan {dateTime(item.decidedAt)}</Text>}
            <View style={ui.row}>
              <Text style={[ui.meta, { flex: 1 }]}>{dateTime(item.createdAt)}</Text>
              <Text style={ui.link}>Lihat detail ↗</Text>
            </View>
          </Pressable>
        ))}
    </AppPage>
  );
}
