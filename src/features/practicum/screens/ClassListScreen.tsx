import { useRouter } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { useAuth } from '../../auth/AuthProvider';
import { ActionButton } from '../../../components/ActionButton';
import { ClassCard } from '../components/ClassCard';
import { PracticumHeader } from '../components/PracticumHeader';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { SyncStatusBanner } from '../components/SyncStatusBanner';
import { useAssistantClasses } from '../hooks';
import { colors, spacing } from '../theme';

export function ClassListScreen() {
  const router = useRouter();
  const isAslab = useAuth().profile?.role === 'admin';
  const {
    status,
    classes,
    error,
    refreshing,
    reload,
    syncError,
    fromCache,
    retrySync,
  } = useAssistantClasses();

  function goBack() {
    router.dismissTo(isAslab ? '/lokasi' : '/jadwal');
  }

  function openCreate() {
    router.push('/kelas/new');
  }

  function openClass(classId: string) {
    router.push(`/kelas/${classId}`);
  }

  return (
    <View style={styles.screen}>
      <PracticumHeader
        eyebrow={isAslab ? 'Aslab' : 'Asprak'}
        title="Kelola Kelas"
        subtitle="Kelola kelas praktikum yang kamu ampu."
        onBack={goBack}
      />

      <SyncStatusBanner error={syncError} fromCache={fromCache} onRetry={retrySync} />

      {status === 'loading' && classes.length === 0 ? (
        <LoadingState message="Memuat kelas…" />
      ) : null}

      {status === 'error' ? (
        <ErrorState message={error ?? 'Terjadi kesalahan.'} onRetry={reload} />
      ) : null}

      {status === 'ready' ? (
        <FlatList
          data={classes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, classes.length === 0 && styles.emptyList]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <ClassCard item={item} onPress={() => openClass(item.id)} />
          )}
          ListEmptyComponent={
            <EmptyState
              title="Belum ada kelas"
              message="Belum ada kelas dalam cakupan penugasanmu."
              actionLabel={isAslab ? 'Tambah Kelas' : undefined}
              onAction={isAslab ? openCreate : undefined}
            />
          }
          ListFooterComponent={
            isAslab && classes.length > 0 ? (
              <View style={styles.footer}>
                <ActionButton title="Tambah Kelas" onPress={openCreate} />
              </View>
            ) : undefined
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={reload}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  separator: { height: spacing.md },
  footer: { marginTop: spacing.lg },
});
