import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { Text } from '../../components/Text';
import { colors } from '../../theme/tokens';
import { permissionKinds, permissionLabels, type Permission, type PermissionKind } from './model';

export function PermissionBadge({ status }: { status: Permission['status'] }) {
  return (
    <View
      style={[
        ui.badge,
        {
          backgroundColor:
            status === 'approved'
              ? colors.lime
              : status === 'rejected'
                ? colors.peach
                : colors.lavender,
        },
      ]}
    >
      <Text style={ui.badgeText}>{permissionLabels[status]}</Text>
    </View>
  );
}
export function InfoCard({
  label,
  children,
  tone = 'white',
}: {
  label: string;
  children: React.ReactNode;
  tone?: 'white' | 'lime' | 'lavender' | 'peach';
}) {
  return (
    <View style={[ui.card, { backgroundColor: colors[tone] }]}>
      <Text style={ui.eyebrow}>{label}</Text>
      {children}
    </View>
  );
}
export function ChoiceChip({
  label,
  selected,
  onPress,
  disabled,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        ui.chip,
        selected && ui.chipSelected,
        (pressed || disabled) && { opacity: 0.65 },
      ]}
    >
      <Text style={ui.chipText}>{label}</Text>
    </Pressable>
  );
}
export function AiInformation({ permission }: { permission: Permission }) {
  return (
    <InfoCard label="BANTUAN AI · BUKAN KEPUTUSAN" tone="lavender">
      <Text style={ui.heading}>
        {permission.aiStatus === 'completed'
          ? permissionKinds[permission.aiCategory as PermissionKind] ?? permission.aiCategory
          : permission.aiStatus === 'processing'
            ? 'Klasifikasi sedang diproses'
            : 'Klasifikasi belum tersedia'}
      </Text>
      <Text style={ui.copy}>
        {permission.aiError ??
          'Hasil ini hanya informasi pendukung. Keputusan akhir tetap dibuat oleh asisten.'}
      </Text>
      {permission.aiSource && <Text style={ui.meta}>Sumber: {permission.aiSource}</Text>}
      {permission.aiClassifiedAt && (
        <Text style={ui.meta}>Diperbarui {dateTime(permission.aiClassifiedAt)}</Text>
      )}
    </InfoCard>
  );
}
export function dateTime(value: { toDate: () => Date } | null) {
  return value
    ? value.toDate().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Menunggu konfirmasi server';
}
export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    padding: 20,
    gap: 16,
    paddingBottom: 36,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 22,
    gap: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  eyebrow: { fontSize: 10, letterSpacing: 1.4, color: colors.muted, fontWeight: '800' },
  heading: { fontSize: 20, fontWeight: '800', color: colors.navy, lineHeight: 28 },
  copy: { fontSize: 14, color: colors.navy, lineHeight: 23 },
  meta: { fontSize: 12, color: colors.muted, lineHeight: 20 },
  badge: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '800', color: colors.navy },
  chip: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  chipSelected: { backgroundColor: colors.lime, borderColor: '#CFE685' },
  chipText: { fontSize: 12, color: colors.navy, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.background,
    borderRadius: 18,
    padding: 16,
    color: colors.navy,
    fontSize: 15,
    minHeight: 52,
  },
  error: { color: colors.danger, lineHeight: 22, fontSize: 13 },
  notice: { backgroundColor: colors.peach, borderRadius: 18, padding: 16, gap: 8 },
  success: { color: colors.success, fontWeight: '700', fontSize: 14, lineHeight: 22 },
  stat: { flex: 1, minWidth: 80, padding: 16, borderRadius: 22, gap: 4 } as ViewStyle,
  statValue: { fontSize: 30, fontWeight: '800', color: colors.navy },
  link: { color: colors.blue, fontSize: 13, fontWeight: '800' },
});
