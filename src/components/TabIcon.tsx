import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../theme/tokens';

export type TabIconKind = 'jadwal' | 'catatan' | 'profil' | 'lokasi' | 'izin' | 'users' | 'lab' | 'maps';

export function TabIcon({
  kind,
  color,
  selected = false,
}: {
  kind: TabIconKind;
  color: ViewStyle['borderColor'];
  selected?: boolean;
}) {
  const stroke = typeof color === 'string' ? color : colors.navy;
  return (
    <View style={[styles.container, selected && styles.selected]}>
      <Svg width={23} height={23} viewBox="0 0 24 24" fill="none" accessibilityElementsHidden>
        {kind === 'jadwal' ? <>
          <Rect x="3.5" y="5" width="17" height="16" rx="2.5" stroke={stroke} strokeWidth="1.8" />
          <Path d="M7.5 3.5v3M16.5 3.5v3M4 9.5h16M8 13h3M8 16.5h3M14 13h2" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        </> : null}
        {kind === 'catatan' ? <>
          <Path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5a1.5 1.5 0 0 1 1-1.5Z" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
          <Path d="M14 3.8V8h4M9 12h6M9 16h6" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </> : null}
        {kind === 'izin' ? <>
          <Path d="M7 3.5h10A1.5 1.5 0 0 1 18.5 5v14a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5Z" stroke={stroke} strokeWidth="1.8" />
          <Path d="M9 8h6M9 12h2M9 16h2" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
          <Path d="m14 15 1.2 1.2L18 13" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </> : null}
        {kind === 'users' ? <>
          <Circle cx="9" cy="8" r="3" stroke={stroke} strokeWidth="1.8" />
          <Path d="M3.5 20v-1.5A4.5 4.5 0 0 1 8 14h2a4.5 4.5 0 0 1 4.5 4.5V20M16 5.5a3 3 0 0 1 0 5.8M17 14h.5a3 3 0 0 1 3 3V20" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        </> : null}
        {kind === 'lab' ? <>
          <Path d="M9 3.5h6M10 3.5v6l-5.3 9.1A1.9 1.9 0 0 0 6.3 21h11.4a1.9 1.9 0 0 0 1.6-2.4L14 9.5v-6" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M7.3 16h9.4M9.1 13h5.8" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        </> : null}
        {kind === 'lokasi' ? <>
          <Path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
          <Circle cx="12" cy="10" r="2.5" stroke={stroke} strokeWidth="1.8" />
        </> : null}
        {kind === 'maps' ? <>
          <Path d="m3.5 6 5-2.5 7 2 5-2v14l-5 2.5-7-2-5 2V6Z" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
          <Path d="M8.5 3.8v14M15.5 5.5v14" stroke={stroke} strokeWidth="1.8" />
        </> : null}
        {kind === 'profil' ? <>
          <Circle cx="12" cy="8" r="3.5" stroke={stroke} strokeWidth="1.8" />
          <Path d="M4.5 20a7.5 7.5 0 0 1 15 0" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        </> : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: 44, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  selected: { backgroundColor: colors.lime },
});
