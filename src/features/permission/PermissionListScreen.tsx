import { useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { AppPage } from '../../components/AppPage';
import { ActionButton } from '../../components/ActionButton';
import { Text } from '../../components/Text';
import { useAuth } from '../auth/AuthProvider';
import { EmptyState, ErrorState, LoadingState } from '../practicum/components/StateViews';
import { filterPermissions, permissionLabels, permissionStatusExplanation } from './model';
import { usePermissions } from './hooks';
import { ChoiceChip, dateTime, PermissionBadge, ui } from './ui';
import { colors } from '../../theme/tokens';

type PickerTarget = 'class' | 'session' | null;

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
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const classes = [...new Map(resource.data.map((item) => [item.classId, item.className])).entries()];
  const sessions = [...new Map(resource.data.filter((item) => !classId || item.classId === classId)
    .map((item) => [item.sessionId, item.sessionTitle])).entries()];
  const selectedClassName = classes.find(([id]) => id === classId)?.[1] ?? 'Semua kelas';
  const selectedSessionTitle = sessions.find(([id]) => id === sessionId)?.[1] ?? 'Semua sesi';
  const items = filterPermissions(resource.data, filter, search, { classId, sessionId });
  const pickerOptions: [string, string][] =
    pickerTarget === 'class'
      ? [['', 'Semua kelas'], ...classes]
      : pickerTarget === 'session'
        ? [['', 'Semua sesi'], ...sessions]
        : [];
  const activePickerValue = pickerTarget === 'class' ? classId : sessionId;
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
        {assistant && resource.status === 'ready' && (
          <View style={styles.dropdownRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Filter kelas: ${selectedClassName}`}
              onPress={() => setPickerTarget('class')}
              style={({ pressed }) => [
                styles.dropdown,
                !!classId && styles.dropdownActive,
                pressed && styles.dropdownPressed,
              ]}
            >
              <View style={styles.dropdownCopy}>
                <Text style={styles.dropdownLabel}>KELAS</Text>
                <Text numberOfLines={1} style={styles.dropdownValue}>
                  {selectedClassName}
                </Text>
              </View>
              <Text style={styles.dropdownChevron}>⌄</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Filter sesi: ${selectedSessionTitle}`}
              onPress={() => setPickerTarget('session')}
              style={({ pressed }) => [
                styles.dropdown,
                !!sessionId && styles.dropdownActive,
                pressed && styles.dropdownPressed,
              ]}
            >
              <View style={styles.dropdownCopy}>
                <Text style={styles.dropdownLabel}>SESI</Text>
                <Text numberOfLines={1} style={styles.dropdownValue}>
                  {selectedSessionTitle}
                </Text>
              </View>
              <Text style={styles.dropdownChevron}>⌄</Text>
            </Pressable>
          </View>
        )}
      </View>
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
      <Modal
        visible={pickerTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerTarget(null)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setPickerTarget(null)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalEyebrow}>
              {pickerTarget === 'class' ? 'FILTER KELAS' : 'FILTER SESI'}
            </Text>
            <Text style={styles.modalTitle}>
              {pickerTarget === 'class' ? 'Pilih kelas' : 'Pilih sesi'}
            </Text>
            <ScrollView
              style={styles.modalList}
              contentContainerStyle={styles.modalListContent}
              showsVerticalScrollIndicator={false}
            >
              {pickerOptions.map(([id, label]) => {
                const selected = activePickerValue === id;
                return (
                  <Pressable
                    key={id || '__all__'}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                    accessibilityState={{ selected }}
                    onPress={() => {
                      if (pickerTarget === 'class') {
                        setClassId(id);
                        setSessionId('');
                      } else if (pickerTarget === 'session') {
                        setSessionId(id);
                      }
                      setPickerTarget(null);
                    }}
                    style={({ pressed }) => [
                      styles.modalOption,
                      selected && styles.modalOptionSelected,
                      pressed && styles.dropdownPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        selected && styles.modalOptionTextSelected,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <ActionButton
              title="Tutup"
              secondary
              onPress={() => setPickerTarget(null)}
            />
          </View>
        </View>
      </Modal>
    </AppPage>
  );
}

const styles = StyleSheet.create({
  dropdownRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  dropdown: {
    flex: 1,
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  dropdownActive: {
    borderColor: colors.blue,
    backgroundColor: '#EDF1FF',
  },
  dropdownPressed: { opacity: 0.78 },
  dropdownCopy: { flex: 1, gap: 2 },
  dropdownLabel: {
    color: colors.blue,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  dropdownValue: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: '700',
  },
  dropdownChevron: {
    color: colors.blue,
    fontSize: 18,
    lineHeight: 18,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#20251F80',
  },
  modalCard: {
    maxHeight: '78%',
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  modalEyebrow: {
    color: colors.blue,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  modalTitle: {
    color: colors.navy,
    fontSize: 20,
    fontWeight: '800',
  },
  modalList: { maxHeight: 340 },
  modalListContent: { gap: 8 },
  modalOption: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    paddingVertical: 11,
    justifyContent: 'center',
  },
  modalOptionSelected: {
    borderColor: colors.blue,
    backgroundColor: '#EDF1FF',
  },
  modalOptionText: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: '700',
  },
  modalOptionTextSelected: {
    color: colors.blue,
  },
});
