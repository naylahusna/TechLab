import { useRouter } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { ActionButton } from '../../../components/ActionButton';
import { ClassCard } from '../components/ClassCard';
import { PracticumHeader } from '../components/PracticumHeader';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { useAssistantClasses } from '../hooks';
import { colors, spacing } from '../theme';

export function ClassListScreen() {
  const router = useRouter();
  const { status, classes, error, refreshing, reload } = useAssistantClasses();

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/jadwal');
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
        eyebrow="Asisten"
        title="Kelola Kelas"
        subtitle="Kelola kelas praktikum yang kamu ampu."
        onBack={goBack}
      />

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
              message="Buat kelas pertamamu untuk mulai mengelola peserta, jadwal, dan sesi."
              actionLabel="Tambah Kelas"
              onAction={openCreate}
            />
          }
          ListFooterComponent={
            classes.length > 0 ? (
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
