import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RoleProvider } from '../core/role-context';
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
      <RoleProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </RoleProvider>
    </SafeAreaProvider>
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
