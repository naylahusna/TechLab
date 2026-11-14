import { Redirect, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useAuth } from '../../features/auth/AuthProvider';
import { AssistantRekapScreen } from '../../features/assistant';
import { NavigationLandingScreen } from '../../features/navigation/NavigationLandingScreen';
import { RiwayatScreen } from '../../features/practitioner';
import {
  useAssistantRecapOverview,
  usePractitionerHistory,
} from '../../features/practicum';
import {
  ErrorState,
  LoadingState,
} from '../../features/practicum/components/StateViews';
import { initialsFor } from '../../features/practicum/profile-view';
import { colors } from '../../theme/tokens';

export default function RecordsRoute() {
  const auth = useAuth();

  if (!auth.profile) return <Redirect href="/" />;
  if (auth.profile.role === 'asisten') return <AssistantRecords />;
  if (auth.profile.role === 'praktikan') return <PractitionerRecords />;
  return <NavigationLandingScreen page="catatan" />;
}

function AssistantRecords() {
  const auth = useAuth();
  const router = useRouter();
  const overview = useAssistantRecapOverview();
  const profile = auth.profile;

  if (overview.status === 'loading') {
    return (
      <View style={styles.screen}>
        <LoadingState message="Memuat rekap kehadiran…" />
      </View>
    );
  }

  if (overview.status === 'error') {
    return (
      <View style={styles.screen}>
        <ErrorState
          message={overview.error ?? 'Tidak dapat memuat rekap kehadiran.'}
          onRetry={overview.reload}
        />
      </View>
    );
  }

  return (
    <AssistantRekapScreen
      items={overview.items}
      assistantName={profile?.name}
      assistantInitials={profile ? initialsFor(profile.name) : undefined}
      onSelectSession={(sessionId) => router.push(`/sesi/${sessionId}`)}
    />
  );
}

function PractitionerRecords() {
  const auth = useAuth();
  const history = usePractitionerHistory();
  const profile = auth.profile;

  if (history.status === 'loading') {
    return (
      <View style={styles.screen}>
        <LoadingState message="Memuat riwayat kehadiran…" />
      </View>
    );
  }

  if (history.status === 'error') {
    return (
      <View style={styles.screen}>
        <ErrorState
          message={history.error ?? 'Tidak dapat memuat riwayat kehadiran.'}
          onRetry={history.reload}
        />
      </View>
    );
  }

  return (
    <RiwayatScreen
      items={history.items}
      praktikanName={profile?.name}
      praktikanInitials={profile ? initialsFor(profile.name) : undefined}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
});
