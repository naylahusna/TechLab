import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/tokens';

type Props = { kind: 'lab' | 'praktikan' | 'asisten'; color?: string };

/** Native shapes avoid adding an icon library for this screen. */
export function RoleIcon({ kind, color = colors.blue }: Props) {
  return (
    <View style={styles.canvas} accessible={false} importantForAccessibility="no-hide-descendants">
      {kind === 'lab' ? (
        <>
          <View style={[styles.flaskBody, { borderColor: color }]} />
          <View style={[styles.flaskNeck, { borderColor: color }]} />
          <View style={[styles.flaskLip, { backgroundColor: color }]} />
          <View style={[styles.flaskLiquid, { backgroundColor: color }]} />
        </>
      ) : kind === 'praktikan' ? (
        <>
          <View style={[styles.capBase, { borderColor: color }]} />
          <View style={[styles.capTop, { borderColor: color }]} />
          <View style={[styles.tassel, { backgroundColor: color }]} />
        </>
      ) : (
        <>
          <View style={[styles.clipboard, { borderColor: color }]} />
          <View style={[styles.clip, { backgroundColor: color }]} />
          {[12, 17, 22].map((top) => (
            <View key={top} style={[styles.listLine, { top, backgroundColor: color }]} />
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: { width: 32, height: 32 },
  flaskBody: {
    position: 'absolute',
    left: 5,
    top: 12,
    width: 22,
    height: 17,
    borderWidth: 2,
    borderRadius: 6,
  },
  flaskNeck: {
    position: 'absolute',
    left: 12,
    top: 4,
    width: 8,
    height: 13,
    borderLeftWidth: 2,
    borderRightWidth: 2,
  },
  flaskLip: { position: 'absolute', left: 10, top: 3, width: 12, height: 2, borderRadius: 1 },
  flaskLiquid: { position: 'absolute', left: 10, top: 22, width: 12, height: 2, borderRadius: 1 },
  capBase: {
    position: 'absolute',
    left: 8,
    top: 15,
    width: 17,
    height: 11,
    borderWidth: 2,
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7,
  },
  capTop: {
    position: 'absolute',
    left: 6,
    top: 6,
    width: 21,
    height: 14,
    borderWidth: 2,
    backgroundColor: colors.paleBlue,
    transform: [{ rotate: '-25deg' }, { skewX: '35deg' }],
  },
  tassel: { position: 'absolute', right: 2, top: 13, width: 2, height: 13 },
  clipboard: {
    position: 'absolute',
    left: 6,
    top: 5,
    width: 21,
    height: 25,
    borderWidth: 2,
    borderRadius: 4,
  },
  clip: { position: 'absolute', left: 12, top: 3, width: 9, height: 5, borderRadius: 2 },
  listLine: { position: 'absolute', left: 12, width: 9, height: 2, borderRadius: 1 },
});
