import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '../../components/Text';
import { roleLabels } from '../../core/roles';
import { useRole } from '../../core/role-context';
import { watchLabLocations, type LabLocation } from '../assistant/lab-locations';
import { ScreenHeader } from '../practitioner/components/ScreenHeader';
import { colors } from '../../theme/tokens';
import { MapViewport } from './MapViewport';
import { campusCenter } from './map-document';

export function LabMapScreen() {
  const { currentUser } = useRole();
  const [labs, setLabs] = useState<LabLocation[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    return watchLabLocations(
      (locations) => {
        setFailed(false);
        setLabs(locations.filter(({ name, latitude, longitude }) =>
          typeof name === 'string'
          && Number.isFinite(latitude) && Math.abs(latitude) <= 90
          && Number.isFinite(longitude) && Math.abs(longitude) <= 180,
        ));
      },
      () => setFailed(true),
    );
  }, []);

  const selected = labs?.find(({ id }) => id === selectedId);
  const center = selected ?? campusCenter;

  return (
    <View style={styles.page}>
      <ScreenHeader
        title="Peta laboratorium"
        roleLabel={currentUser ? roleLabels[currentUser.role] : undefined}
      />
      <View style={styles.content}>
        <View style={styles.map} testID="lab-map">
          <MapViewport key={`${selected?.id ?? ""}:${center.latitude},${center.longitude}`} center={center} />
        </View>
        {failed ? (
          <Text accessibilityRole="alert" style={styles.status}>Lokasi laboratorium gagal dimuat.</Text>
        ) : labs === null ? (
          <View accessibilityLiveRegion="polite" style={styles.loading}>
            <ActivityIndicator color={colors.blue} />
            <Text style={styles.status}>Memuat lokasi laboratorium…</Text>
          </View>
        ) : labs.length === 0 ? (
          <Text accessibilityLiveRegion="polite" style={styles.status}>Belum ada lokasi laboratorium.</Text>
        ) : (
          <View>
            <Text style={styles.label}>Fokus peta</Text>
            <ScrollView horizontal contentContainerStyle={styles.options}>
              <LocationOption label="Area kampus" active={!selected} onPress={() => setSelectedId(null)} />
              {labs.map(({ id, name }) => (
                <LocationOption key={id} label={name} active={selected?.id === id} onPress={() => setSelectedId(id)} />
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
}

function LocationOption({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.option, active && styles.activeOption]}
    >
      <Text style={[styles.optionText, active && styles.activeText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: 16, gap: 12 },
  map: { flex: 1, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.paleBlue },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  status: { color: colors.muted },
  label: { color: colors.navy, fontWeight: '700', marginBottom: 8 },
  options: { gap: 8 },
  option: { borderRadius: 12, backgroundColor: colors.white, paddingHorizontal: 12, paddingVertical: 10 },
  activeOption: { backgroundColor: colors.navy },
  optionText: { color: colors.navy, fontWeight: '600' },
  activeText: { color: colors.white },
});
