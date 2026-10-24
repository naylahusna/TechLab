import { Redirect, Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabIcon } from '../../components/TabIcon';
import { navigationFor } from '../../core/navigation';
import { useRole } from '../../core/role-context';
import { colors } from '../../theme/tokens';

export const unstable_settings = { anchor: 'jadwal' };

export default function TabsLayout() {
  const { currentUser } = useRole();
  const insets = useSafeAreaInsets();
  if (!currentUser) return <Redirect href="/" />;
  const navigation = navigationFor(currentUser.role);
  return (
    <Tabs
      key={`${currentUser.role}-${currentUser.id}`}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 3 },
        tabBarStyle: { height: 68 + insets.bottom, paddingBottom: Math.max(insets.bottom, 8), paddingTop: 8, backgroundColor: colors.white, borderTopColor: colors.line },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="jadwal" options={{ title: navigation.jadwal.label, tabBarButtonTestID: 'tab-jadwal', tabBarIcon: ({ color }) => <TabIcon kind="jadwal" color={color} /> }} />
      <Tabs.Screen name="catatan" options={{ title: navigation.catatan.label, tabBarButtonTestID: 'tab-catatan', tabBarIcon: ({ color }) => <TabIcon kind="catatan" color={color} /> }} />
      <Tabs.Screen name="profil" options={{ title: navigation.profil.label, tabBarButtonTestID: 'tab-profil', tabBarIcon: ({ color }) => <TabIcon kind="profil" color={color} /> }} />
    </Tabs>
  );
}
