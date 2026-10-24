import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRole } from '../core/role-context';
import { colors } from '../theme/tokens';

export function AppPage({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const { currentUser } = useRole();
  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.hero, { paddingTop: insets.top + 22 }]}>
          <View style={styles.headerInner}>
            <View style={styles.topRow}>
              <View style={styles.brandRow}>
                <Text style={styles.brand}>TechLab<Text style={styles.dot}>.</Text></Text>
                <View style={styles.badge}><Text style={styles.badgeText}>{currentUser?.role === 'praktikan' ? 'Praktikan' : 'Asisten'}</Text></View>
              </View>
              <Pressable testID="header-profile" accessibilityRole="button" accessibilityLabel={`Buka profil ${currentUser?.name ?? ''}`} onPress={() => router.navigate('/profil')} style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}>
                <Text style={styles.initials}>{currentUser?.initials}</Text>
              </Pressable>
            </View>
            <Text style={styles.greeting}>Halo, {currentUser?.name}</Text>
            <Text accessibilityRole="header" style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
        </View>
        <View style={styles.content}>{children}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.blue },
  scroll: { flexGrow: 1, backgroundColor: colors.background, paddingBottom: 28 },
  hero: { backgroundColor: colors.blue, paddingBottom: 38, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerInner: { width: '100%', maxWidth: 720, paddingHorizontal: 24, alignSelf: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  brandRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, flex: 1 },
  brand: { color: colors.white, fontWeight: '800', fontSize: 23, letterSpacing: -0.8 },
  dot: { color: colors.mint },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: '#FFFFFF1F' },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  avatar: { width: 46, height: 46, borderRadius: 16, backgroundColor: '#E1EBFF', justifyContent: 'center', alignItems: 'center' },
  initials: { color: colors.blue, fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.75 },
  greeting: { color: '#C4DCFF', fontSize: 12, marginTop: 28, lineHeight: 20 },
  title: { color: colors.white, fontWeight: '700', fontSize: 27, lineHeight: 35, letterSpacing: -0.8, marginTop: 8 },
  subtitle: { color: '#E0EAFF', fontSize: 13, lineHeight: 21, marginTop: 10, maxWidth: 450 },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: 16, marginTop: -14, gap: 16 },
});
