import { Redirect, Tabs, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabIcon } from '../../components/TabIcon';
import { navigationFor } from '../../core/navigation';
import { useRole } from '../../core/role-context';
import { colors, typography } from '../../theme/tokens';

export const unstable_settings = { anchor: 'jadwal' };

export default function TabsLayout() {
  const { currentUser } = useRole();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  if (!currentUser) return <Redirect href="/" />;
  const isAdmin = currentUser.role === 'admin';
  if (isAdmin && ['/jadwal', '/catatan', '/izin'].includes(pathname)) {
    return <Redirect href="/kelola-pengguna" />;
  }
  const navigation = navigationFor(currentUser.role);
  return (
    <Tabs
      backBehavior={isAdmin ? 'history' : 'initialRoute'}
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
          href: isAdmin ? null : undefined,
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
          href: isAdmin ? null : undefined,
          tabBarButtonTestID: 'tab-catatan',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon kind="catatan" color={color} selected={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="izin"
        options={{
          title: currentUser.role === 'asisten' ? 'Tinjau Izin' : 'Izin Saya',
          href: isAdmin ? null : undefined,
          tabBarButtonTestID: 'tab-izin',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon kind="catatan" color={color} selected={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="kelola-pengguna"
        options={{
          title: 'Kelola Pengguna',
          href: isAdmin ? undefined : null,
          tabBarButtonTestID: 'tab-kelola-pengguna',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon kind="catatan" color={color} selected={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="lokasi"
        options={{
          title: isAdmin ? 'Lab' : 'Lokasi Lab',
          href: isAdmin || currentUser.role === 'asisten' ? undefined : null,
          tabBarButtonTestID: 'tab-lokasi',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon kind="lokasi" color={color} selected={focused} />
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
