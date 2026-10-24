import { StyleSheet, View, type ViewStyle } from 'react-native';

export function TabIcon({ kind, color }: { kind: 'jadwal' | 'catatan' | 'profil'; color: ViewStyle['borderColor'] }) {
  return (
    <View style={styles.canvas} accessible={false} importantForAccessibility="no-hide-descendants">
      {kind === 'profil' ? (
        <><View style={[styles.head, { borderColor: color }]} /><View style={[styles.shoulders, { borderColor: color }]} /></>
      ) : (
        <>
          <View style={[styles.document, { borderColor: color }]} />
          {kind === 'jadwal' ? (
            <><View style={[styles.calendarRule, { backgroundColor: color }]} /><View style={[styles.bindingLeft, { backgroundColor: color }]} /><View style={[styles.bindingRight, { backgroundColor: color }]} /><View style={[styles.date, { backgroundColor: color }]} /></>
          ) : (
            <>{[9, 14, 19].map((top) => <View key={top} style={[styles.textLine, { top, backgroundColor: color }]} />)}</>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: { width: 28, height: 28 },
  document: { position: 'absolute', top: 4, left: 4, width: 20, height: 21, borderRadius: 5, borderWidth: 1.8 },
  calendarRule: { position: 'absolute', top: 10, left: 5, width: 18, height: 1.8 },
  bindingLeft: { position: 'absolute', top: 1, left: 9, height: 7, width: 2, borderRadius: 1 },
  bindingRight: { position: 'absolute', top: 1, right: 9, height: 7, width: 2, borderRadius: 1 },
  date: { position: 'absolute', top: 15, left: 10, width: 4, height: 4, borderRadius: 1 },
  textLine: { position: 'absolute', left: 9, width: 10, height: 1.8, borderRadius: 1 },
  head: { position: 'absolute', top: 2, left: 9, width: 10, height: 10, borderWidth: 1.8, borderRadius: 5 },
  shoulders: { position: 'absolute', top: 16, left: 4, width: 20, height: 9, borderWidth: 1.8, borderTopLeftRadius: 10, borderTopRightRadius: 10, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
});
