import { StatusBar } from 'expo-status-bar';
import { useRef, useState, type ComponentRef } from 'react';
import {
  Platform, Pressable, ScrollView, StatusBar as NativeStatusBar,
  StyleSheet, Text, useWindowDimensions, View,
} from 'react-native';

import { useRole } from '../../core/role-context';
import type { Role } from '../../core/roles';
import { RoleIcon } from './RoleIcon';

const roles = [
  {
    id: 'praktikan', title: 'Praktikan',
    description: 'Ikuti praktikum dan catat kehadiranmu.',
    welcome: 'Siap mengikuti praktikum?',
    introduction: 'Sebagai praktikan, kamu akan melihat jadwal, melakukan presensi, dan melihat catatan kehadiranmu.',
  },
  {
    id: 'asisten', title: 'Asisten',
    description: 'Kelola sesi dan pantau kehadiran praktikan.',
    welcome: 'Siap mendampingi praktikum?',
    introduction: 'Sebagai asisten, kamu akan mengelola sesi praktikum dan memantau rekap kehadiran peserta.',
  },
] as const;

export function RoleSelectionScreen() {
  const { currentRole, selectRole } = useRole();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const { width } = useWindowDimensions();
  const wide = width > 780;
  const activeRole = roles.find((role) => role.id === currentRole);

  function confirmRole() {
    if (!selectedRole) return;
    selectRole(selectedRole);
    setConfirmed(true);
  }

  return (
    <View style={styles.screen}>
      <StatusBar style={wide ? 'dark' : 'light'} />
      <ScrollView
        ref={scroll}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.scrollContent, wide && styles.scrollContentWide]}
        onContentSizeChange={() => {
          if (confirmed) scroll.current?.scrollToEnd({ animated: true });
        }}
      >
        <View style={[styles.layout, wide && styles.layoutWide]}>
          <View style={[styles.story, wide && styles.storyWide]}>
            <View pointerEvents="none" style={styles.decorativeRing} />
            <View pointerEvents="none" style={styles.decorativeRingOuter} />
            <View style={styles.brand}>
              <View style={styles.brandMark}><RoleIcon kind="lab" /></View>
              <Text style={styles.brandName}>TechLab<Text style={styles.brandDot}>.</Text></Text>
            </View>
            {wide && (
              <View style={styles.illustration} accessible={false}>
                <View style={styles.illustrationRing} />
                <View style={styles.illustrationTile}><RoleIcon kind="lab" /></View>
                <View style={styles.mintTile} />
              </View>
            )}
            <View style={styles.storyCopy}>
              <Text style={styles.storyLabel}>PRAKTIKUM LEBIH TERATUR</Text>
              <Text style={styles.storyTitle}>{'Satu praktikum.\nDua peran penting.'}</Text>
              <Text style={styles.storyDescription}>Mulai aktivitas praktikum dengan tampilan yang sesuai peranmu.</Text>
            </View>
          </View>
          <View style={[styles.panel, wide && styles.panelWide]}>
            <Text style={styles.eyebrow}>PRESENSI PRAKTIKUM</Text>
            <Text accessibilityRole="header" style={styles.title}>Masuk sebagai siapa?</Text>
            <Text style={styles.subtitle}>Pilih peranmu untuk memulai aktivitas praktikum.</Text>
            <View style={styles.choices} accessibilityLabel="Pilihan peran">
              {roles.map((role) => {
                const selected = selectedRole === role.id;
                return (
                  <Pressable
                    key={role.id}
                    testID={`role-${role.id}`}
                    accessibilityRole="radio"
                    accessibilityLabel={`${role.title}. ${role.description}`}
                    accessibilityState={{ checked: selected }}
                    onPress={() => { setSelectedRole(role.id); setConfirmed(false); }}
                    style={({ pressed }) => [styles.card, selected && styles.cardSelected, pressed && styles.pressed]}
                  >
                    <View style={[styles.roleIcon, selected && styles.roleIconSelected]}><RoleIcon kind={role.id} /></View>
                    <View style={styles.cardCopy}>
                      <Text style={styles.cardTitle}>{role.title}</Text>
                      <Text style={styles.cardDescription}>{role.description}</Text>
                    </View>
                    <View style={[styles.indicator, selected && styles.indicatorSelected]}>
                      {selected && <Text style={styles.check}>✓</Text>}
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              testID="continue-button"
              accessibilityRole="button"
              accessibilityState={{ disabled: selectedRole === null }}
              disabled={selectedRole === null}
              onPress={confirmRole}
              style={({ pressed }) => [styles.continueButton, !selectedRole && styles.buttonDisabled, pressed && styles.pressed]}
            >
              <Text style={[styles.buttonText, !selectedRole && styles.buttonTextDisabled]}>Lanjutkan</Text>
              <Text accessible={false} style={[styles.arrow, !selectedRole && styles.buttonTextDisabled]}>→</Text>
            </Pressable>
            {confirmed && activeRole && (
              <View testID={`role-confirmed-${activeRole.id}`} style={styles.confirmation} accessibilityLiveRegion="polite" accessible>
                <Text style={styles.confirmationLabel}>✓  Peran {activeRole.title} dipilih</Text>
                <Text style={styles.confirmationTitle}>{activeRole.welcome}</Text>
                <Text style={styles.confirmationDescription}>{activeRole.introduction}</Text>
              </View>
            )}
            <Text style={styles.demoNote}>Demo interaktif menggunakan data contoh.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#1459D9' },
  scrollContent: { flexGrow: 1, backgroundColor: '#FAFBFD', paddingBottom: 48 },
  scrollContentWide: { justifyContent: 'center', paddingHorizontal: 40, paddingVertical: 56 },
  layout: { width: '100%', maxWidth: 520, alignSelf: 'center' },
  layoutWide: { maxWidth: 1120, flexDirection: 'row', gap: 28 },
  story: { overflow: 'hidden', backgroundColor: '#1459D9', paddingHorizontal: 28, paddingTop: Platform.OS === 'android' ? (NativeStatusBar.currentHeight ?? 0) + 24 : 24, paddingBottom: 40, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  storyWide: { flex: 0.95, borderRadius: 30, minHeight: 650, padding: 40 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandMark: { width: 43, height: 43, borderRadius: 13, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.8 },
  brandDot: { color: '#80E5DC' },
  storyCopy: { marginTop: 34 },
  storyLabel: { color: '#C4DCFF', fontSize: 10, letterSpacing: 1.8, fontWeight: '700' },
  storyTitle: { color: '#FFFFFF', fontSize: 29, lineHeight: 37, fontWeight: '700', marginTop: 12, letterSpacing: -0.8 },
  storyDescription: { color: '#E0EAFF', fontSize: 13, lineHeight: 21, marginTop: 12, maxWidth: 310 },
  decorativeRing: { position: 'absolute', right: -110, top: 76, width: 230, height: 230, borderRadius: 115, borderWidth: 1, borderColor: '#FFFFFF25' },
  decorativeRingOuter: { position: 'absolute', right: -135, top: 51, width: 280, height: 280, borderRadius: 140, borderWidth: 20, borderColor: '#FFFFFF07' },
  illustration: { height: 240, alignItems: 'center', justifyContent: 'center', marginTop: 30 },
  illustrationRing: { position: 'absolute', width: 216, height: 216, borderRadius: 108, borderColor: '#FFFFFF45', borderWidth: 1 },
  illustrationTile: { width: 130, height: 150, borderRadius: 28, backgroundColor: '#E8F0FF', transform: [{ rotate: '-9deg' }], justifyContent: 'center', alignItems: 'center' },
  mintTile: { position: 'absolute', width: 40, height: 40, borderRadius: 12, backgroundColor: '#80E5DC', right: 15, top: 28, transform: [{ rotate: '14deg' }] },
  panel: { backgroundColor: '#FFFFFF', marginHorizontal: 14, marginTop: -10, borderRadius: 24, borderWidth: 1, borderColor: '#E5EAF2', paddingHorizontal: 22, paddingVertical: 30, boxShadow: '0px 12px 36px rgba(20, 35, 63, 0.05)' },
  panelWide: { flex: 1.05, marginHorizontal: 0, marginTop: 0, padding: 36, justifyContent: 'center', borderRadius: 30 },
  eyebrow: { color: '#1459D9', fontSize: 10, fontWeight: '700', letterSpacing: 1.6 },
  title: { fontSize: 27, lineHeight: 35, color: '#14233F', fontWeight: '700', letterSpacing: -0.9, marginTop: 12 },
  subtitle: { fontSize: 13, lineHeight: 21, color: '#64748B', marginTop: 10 },
  choices: { marginTop: 26, gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, minHeight: 104, borderWidth: 1.5, borderColor: '#E5EAF2', borderRadius: 18, backgroundColor: '#FFFFFF' },
  cardSelected: { borderColor: '#1459D9', backgroundColor: '#F0F5FF' },
  roleIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: '#EEF3FC', justifyContent: 'center', alignItems: 'center' },
  roleIconSelected: { backgroundColor: '#E1EBFF' },
  cardCopy: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 15, color: '#14233F', fontWeight: '700' },
  cardDescription: { fontSize: 12, lineHeight: 19, color: '#64748B', marginTop: 5 },
  indicator: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  indicatorSelected: { backgroundColor: '#1459D9', borderColor: '#1459D9' },
  check: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  continueButton: { minHeight: 56, borderRadius: 16, backgroundColor: '#1459D9', marginTop: 26, paddingHorizontal: 22, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  buttonDisabled: { backgroundColor: '#DBE2ED' },
  buttonText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  buttonTextDisabled: { color: '#5C6C82' },
  arrow: { fontSize: 21, lineHeight: 23, color: '#FFFFFF' },
  pressed: { opacity: 0.75 },
  confirmation: { marginTop: 18, backgroundColor: '#F0F5FF', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#D7E5FF' },
  confirmationLabel: { color: '#1459D9', fontWeight: '600', fontSize: 12 },
  confirmationTitle: { color: '#14233F', fontWeight: '700', fontSize: 16, lineHeight: 24, marginTop: 10 },
  confirmationDescription: { color: '#526680', fontSize: 12, lineHeight: 20, marginTop: 6 },
  demoNote: { textAlign: 'center', color: '#64748B', fontSize: 11, lineHeight: 18, marginTop: 24 },
});
