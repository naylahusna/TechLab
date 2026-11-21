import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useEffect, useState } from 'react';

import { useAuth } from '../../../features/auth/AuthProvider';
import { usePermissions } from '../../../features/permission/hooks';
import { AttendanceScreen } from '../../../features/practitioner/screens/AttendanceScreen';
import { PracticumHeader } from '../../../features/practicum/components/PracticumHeader';
import { EmptyState, ErrorState, LoadingState } from '../../../features/practicum/components/StateViews';
import { SyncStatusBanner } from '../../../features/practicum/components/SyncStatusBanner';
import {
  getPracticumRepository,
  practicumErrorMessage,
  useSessionDetail,
} from '../../../features/practicum';
import { toPractitionerSessionDetail, toPraktikanIdentity } from '../../../features/practicum/session-view';
import { colors } from '../../../theme/tokens';
import {
  watchLabLocations,
  type LabLocation,
} from '../../../features/assistant/lab-locations';
import {
  validateAttendanceLocation,
  type LocationValidation,
} from '../../../features/practitioner/lib/location-validation';

export default function AttendanceRoute() {
  const { id, latitude, longitude } = useLocalSearchParams<{
    id?: string | string[];
    latitude?: string | string[];
    longitude?: string | string[];
  }>();
  const auth = useAuth();
  const router = useRouter();
  const [labLocations, setLabLocations] = useState<LabLocation[]>([]);
  useEffect(() => watchLabLocations(setLabLocations, () => setLabLocations([])), []);
  const sessionId = typeof id === 'string' ? id : undefined;
  const detail = useSessionDetail(sessionId);
  const permissionResource = usePermissions();

  if (!auth.profile) return <Redirect href="/" />;
  if (!sessionId) return <Redirect href="/jadwal" />;
  if (auth.profile.role === 'asisten') {
    return <Redirect href={{ pathname: '/sesi/[id]', params: { id: sessionId } }} />;
  }

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/jadwal');
  };

  if (detail.status === 'loading') {
    return <View style={styles.screen}><PracticumHeader title="Presensi" onBack={goBack} /><LoadingState message="Memuat sesi dan status presensi…" /></View>;
  }
  if (detail.status === 'error') {
    return <View style={styles.screen}><PracticumHeader title="Presensi" onBack={goBack} /><ErrorState message={detail.error ?? 'Terjadi kesalahan.'} onRetry={detail.reload} /></View>;
  }
  if (detail.status === 'missing' || !detail.session || !detail.classItem) {
    return <View style={styles.screen}><PracticumHeader title="Presensi" onBack={goBack} /><EmptyState title="Sesi tidak ditemukan" message="Sesi ini tidak tersedia atau kamu tidak memiliki akses." actionLabel="Kembali ke Jadwal" onAction={() => router.replace('/jadwal')} /></View>;
  }

  const session = toPractitionerSessionDetail(
    detail.session,
    detail.classItem,
    detail.schedule,
    detail.attendance,
    auth.profile.uid,
  );
  const latitudeValue = typeof latitude === 'string' ? Number(latitude) : NaN;
  const longitudeValue = typeof longitude === 'string' ? Number(longitude) : NaN;
  const normalizeLabName = (value: string) => value.trim().toLowerCase();
  const labLocation = labLocations.find(
    (location) => normalizeLabName(location.name) === normalizeLabName(session.lab),
  ) ?? null;
  const deviceCoordinates =
    Number.isFinite(latitudeValue) && Number.isFinite(longitudeValue)
      ? { latitude: latitudeValue, longitude: longitudeValue }
      : null;
  const locationValidation: LocationValidation = validateAttendanceLocation(
    deviceCoordinates,
    labLocation,
  );
  const myPermission = permissionResource.data.find(
    (permission) => permission.sessionId === detail.session!.id && permission.userId === auth.profile!.uid,
  );
  if (myPermission && session.myAttendance.status !== 'hadir') {
    if (myPermission.status === 'approved') session.myAttendance.status = 'izin';
    if (myPermission.status === 'pending') session.myAttendance.status = 'izin-menunggu';
  }

  async function confirmAttendance() {
    if (locationValidation.status !== 'inside') {
      return { ok: false as const, reason: locationValidation.message };
    }
    try {
      await getPracticumRepository().recordAttendance(session.id, auth.profile!.uid);
      await detail.reload();
      return { ok: true as const };
    } catch (cause) {
      return { ok: false as const, reason: practicumErrorMessage(cause) };
    }
  }

  return (
    <View style={styles.screen}>
      <SyncStatusBanner error={detail.syncError} fromCache={detail.fromCache} onRetry={detail.retrySync} />
      <AttendanceScreen
        session={session}
        praktikan={toPraktikanIdentity(auth.profile)}
        locationValidation={locationValidation}
        onBack={goBack}
        onConfirmAttendance={confirmAttendance}
      />
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.background } });
