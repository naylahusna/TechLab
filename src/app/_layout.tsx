import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '../features/auth/AuthProvider';
import { AuthBoundary } from '../features/auth/AuthBoundary';
import { appFonts } from '../theme/fonts';
import { colors } from '../theme/tokens';

export default function RootLayout() {
  const [loaded, error] = useFonts(appFonts);
  if (!loaded && !error) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          color={colors.blue}
          size="large"
          accessibilityLabel="Menyiapkan TechLab"
        />
      </View>
    );
  }
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AuthBoundary>
          <AccountNavigation />
        </AuthBoundary>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function AccountNavigation() {
  const { profile } = useAuth();
  // Drop screens and their subscriptions when switching account or active role.
  return (
    <Stack
      key={`${profile?.uid ?? 'guest'}:${profile?.role ?? ''}`}
      screenOptions={{ headerShown: false }}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
