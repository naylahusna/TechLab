import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '../../components/Text';
import { useRole } from '../../core/role-context';
import { watchLabLocations, type LabLocation } from '../assistant/lab-locations';
import { ScreenHeader } from '../practitioner/components/ScreenHeader';
import { colors } from '../../theme/tokens';
import { MapViewport } from './MapViewport';
import { campusCenter } from './map-document';
import type { MapState } from './map-viewport-model';

export function LabMapScreen() {
  const { currentUser } = useRole();
  const [labs, setLabs] = useState<LabLocation[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<MapState['focus']>(null);

  useEffect(() => {
    return watchLabLocations(
      (locations) => {
        setFailed(false);
        const validLocations = locations.filter(({ name, latitude, longitude }) =>
          typeof name === 'string'
          && Number.isFinite(latitude) && Math.abs(latitude) <= 90
          && Number.isFinite(longitude) && Math.abs(longitude) <= 180,
        );
        setLabs(validLocations);
        setSelectedId((id) => validLocations.some((location) => location.id === id) ? id : null);
      },
      () => setFailed(true),
    );
  }, []);

  const selected = labs?.find(({ id }) => id === selectedId);
  const markers = useMemo(() => labs?.map(({ id, name, latitude, longitude }) => ({
    id, name, latitude, longitude,
  })) ?? [], [labs]);
  const mapState = useMemo(() => ({
    labs: markers, selectedId: selected?.id ?? null, focus,
  }), [markers, selected?.id, focus]);
  const selectMarker = useCallback((id: string) => {
    if (labs?.some((lab) => lab.id === id)) setSelectedId(id);
  }, [labs]);

  function focusOn(lab: LabLocation | null) {
    const { latitude, longitude } = lab ?? campusCenter;
    setSelectedId(lab?.id ?? null);
    setFocus((previous) => ({ latitude, longitude, revision: (previous?.revision ?? 0) + 1 }));
  }

  return (
    <View style={styles.page}>
      <ScreenHeader
        title="Peta laboratorium"
        roleLabel={currentUser?.role === 'asisten' ? 'Asisten' : 'Praktikan'}
      />
      <View style={styles.content}>
        <View style={styles.map} testID="lab-map">
          <MapViewport state={mapState} onSelect={selectMarker} />
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
              <LocationOption label="Area kampus" onPress={() => focusOn(null)} />
              {labs.map((lab) => (
                <LocationOption key={lab.id} label={lab.name} active={selected?.id === lab.id} onPress={() => focusOn(lab)} />
              ))}
            </ScrollView>
          </View>
        )}
        {selected && <LabDetails lab={selected} onClose={() => setSelectedId(null)} />}
      </View>
    </View>
  );
}

function LabDetails({ lab, onClose }: { lab: LabLocation; onClose: () => void }) {
  return (
    <View style={styles.details} testID="lab-details" accessibilityLiveRegion="polite">
      <View style={styles.detailsHeader}>
        <Text accessibilityRole="header" style={styles.detailsTitle}>{lab.name}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Tutup detail laboratorium"
          testID="close-lab-details" onPress={onClose} style={styles.close}>
          <Text style={styles.optionText}>Tutup</Text>
        </Pressable>
      </View>
      <Text style={styles.status}>
        {typeof lab.building === 'string' && lab.building.trim() ? lab.building : 'Gedung belum tercatat'}
        {Number.isInteger(lab.floor) ? ` · Lantai ${lab.floor}` : ''}
      </Text>
      <Text style={styles.status}>Radius presensi {Number.isFinite(lab.radiusMeters) && lab.radiusMeters > 0
        ? `${lab.radiusMeters} m` : 'belum tercatat'}</Text>
      <Text style={styles.status}>Jadwal aktivitas belum tersedia di peta.</Text>
    </View>
  );
}

function LocationOption({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
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
  details: { padding: 12, gap: 3, backgroundColor: colors.white, borderColor: colors.line, borderWidth: 1, borderRadius: 16 },
  detailsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  detailsTitle: { flex: 1, color: colors.navy, fontSize: 17, fontWeight: '800' },
  close: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.paleBlue },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  status: { color: colors.muted },
  label: { color: colors.navy, fontWeight: '700', marginBottom: 8 },
  options: { gap: 8 },
  option: { borderRadius: 12, backgroundColor: colors.white, paddingHorizontal: 12, paddingVertical: 10 },
  activeOption: { backgroundColor: colors.navy },
  optionText: { color: colors.navy, fontWeight: '600' },
  activeText: { color: colors.white },
});
