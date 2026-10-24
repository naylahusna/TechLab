import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RoleIcon } from '../features/auth/RoleIcon';
import { colors } from '../theme/tokens';

type Props = {
  title: string;
  subtitle: string;
  eyebrow?: string;
  storyTitle?: string;
  storyDescription?: string;
  children: ReactNode;
};

/** Shared blue hero, rounded sheet and spacing from the SRS-01 reference. */
export function SelectionLayout({ title, subtitle, eyebrow = 'PRESENSI PRAKTIKUM',
  storyTitle = 'Satu praktikum.\nDua peran penting.',
  storyDescription = 'Mulai aktivitas praktikum dengan tampilan yang sesuai peranmu.', children }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const wide = width > 780;
  return (
    <View style={styles.screen}>
      <StatusBar style={wide ? 'dark' : 'light'} />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 24) + 24 }, wide && styles.scrollWide]}>
        <View style={[styles.layout, wide && styles.layoutWide]}>
          <View style={[styles.story, { paddingTop: insets.top + 24 }, wide && styles.storyWide]}>
            <View pointerEvents="none" style={styles.ring} />
            <View pointerEvents="none" style={styles.outerRing} />
            <View style={styles.brand}>
              <View style={styles.brandMark}><RoleIcon kind="lab" /></View>
              <Text style={styles.brandName}>TechLab<Text style={styles.dot}>.</Text></Text>
            </View>
            {wide && <View style={styles.illustration}><View style={styles.tile}><RoleIcon kind="lab" /></View></View>}
            <View style={styles.storyCopy}>
              <Text style={styles.storyLabel}>PRAKTIKUM LEBIH TERATUR</Text>
              <Text style={styles.storyTitle}>{storyTitle}</Text>
              <Text style={styles.storyDescription}>{storyDescription}</Text>
            </View>
          </View>
          <View style={[styles.panel, wide && styles.panelWide]}>
            <Text style={styles.eyebrow}>{eyebrow}</Text>
            <Text accessibilityRole="header" style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            <View style={styles.content}>{children}</View>
            <Text style={styles.note}>Demo interaktif menggunakan data contoh.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1 },
  scrollWide: { justifyContent: 'center', paddingHorizontal: 40, paddingTop: 56 },
  layout: { width: '100%', maxWidth: 520, alignSelf: 'center' },
  layoutWide: { maxWidth: 1120, flexDirection: 'row', gap: 28 },
  story: { overflow: 'hidden', backgroundColor: colors.blue, paddingHorizontal: 28, paddingBottom: 40, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  storyWide: { flex: 0.95, borderRadius: 30, minHeight: 650, padding: 40 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandMark: { width: 43, height: 43, borderRadius: 13, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 24, fontWeight: '800', color: colors.white, letterSpacing: -0.8 },
  dot: { color: colors.mint },
  storyCopy: { marginTop: 34 },
  storyLabel: { color: '#C4DCFF', fontSize: 10, letterSpacing: 1.8, fontWeight: '700' },
  storyTitle: { color: colors.white, fontSize: 29, lineHeight: 37, fontWeight: '700', marginTop: 12, letterSpacing: -0.8 },
  storyDescription: { color: '#E0EAFF', fontSize: 13, lineHeight: 21, marginTop: 12, maxWidth: 310 },
  ring: { position: 'absolute', right: -110, top: 76, width: 230, height: 230, borderRadius: 115, borderWidth: 1, borderColor: '#FFFFFF25' },
  outerRing: { position: 'absolute', right: -135, top: 51, width: 280, height: 280, borderRadius: 140, borderWidth: 20, borderColor: '#FFFFFF07' },
  illustration: { height: 240, alignItems: 'center', justifyContent: 'center', marginTop: 30 },
  tile: { width: 130, height: 150, borderRadius: 28, backgroundColor: '#E8F0FF', transform: [{ rotate: '-9deg' }], justifyContent: 'center', alignItems: 'center' },
  panel: { backgroundColor: colors.white, marginHorizontal: 14, marginTop: -10, borderRadius: 24, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 22, paddingVertical: 30, boxShadow: '0px 12px 36px rgba(20, 35, 63, 0.05)' },
  panelWide: { flex: 1.05, marginHorizontal: 0, marginTop: 0, padding: 36, justifyContent: 'center', borderRadius: 30 },
  eyebrow: { color: colors.blue, fontSize: 10, fontWeight: '700', letterSpacing: 1.6 },
  title: { fontSize: 27, lineHeight: 35, color: colors.navy, fontWeight: '700', letterSpacing: -0.9, marginTop: 12 },
  subtitle: { fontSize: 13, lineHeight: 21, color: colors.muted, marginTop: 10 },
  content: { marginTop: 26, gap: 14 },
  note: { textAlign: 'center', color: colors.muted, fontSize: 11, lineHeight: 18, marginTop: 24 },
});
