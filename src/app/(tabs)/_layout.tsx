import { Redirect, Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabIcon } from '../../components/TabIcon';
import { navigationFor } from '../../core/navigation';
import { useRole } from '../../core/role-context';
import { colors, typography } from '../../theme/tokens';

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
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontFamily: typography.family,
          fontSize: 11,
          fontWeight: '700',
          marginTop: 5,
        },
        tabBarStyle: {
          height: 76 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
          backgroundColor: colors.white,
          borderTopColor: colors.line,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="jadwal"
        options={{
          title: navigation.jadwal.label,
          tabBarButtonTestID: 'tab-jadwal',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon kind="jadwal" color={color} selected={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="catatan"
        options={{
          title: navigation.catatan.label,
          tabBarButtonTestID: 'tab-catatan',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon kind="catatan" color={color} selected={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: navigation.profil.label,
          tabBarButtonTestID: 'tab-profil',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon kind="profil" color={color} selected={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
