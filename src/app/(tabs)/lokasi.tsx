import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Text } from '../../components/Text';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { useAuth } from '../../features/auth/AuthProvider';
import { type LabLocation, removeLabLocation, saveLabLocation, watchLabLocations } from '../../features/assistant/lab-locations';
import { ScreenHeader } from '../../features/practitioner/components/ScreenHeader';
import { initialsFor } from '../../features/practicum/profile-view';
import { colors } from '../../theme/tokens';

export default function LabLocationsRoute() {
  const { profile } = useAuth();
  if (profile?.role !== 'admin') {
    return <View style={styles.page}><Text>Halaman ini hanya untuk Aslab.</Text></View>;
  }
  return <LabLocations name={profile.name} />;
}

function LabLocations({ name: profileName }: { name: string }) {
  const [locations, setLocations] = useState<LabLocation[]>([]);
  const [editing, setEditing] = useState<LabLocation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LabLocation | null>(null);
  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radius, setRadius] = useState('100');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    return watchLabLocations(setLocations, (e) => setError(e.message));
  }, []);
  const reset = () => { setEditing(null); setName(''); setLatitude(''); setLongitude(''); setRadius('100'); setBuilding(''); setFloor(''); };
  const edit = (item: LabLocation) => { setEditing(item); setName(item.name); setLatitude(String(item.latitude)); setLongitude(String(item.longitude)); setRadius(String(item.radiusMeters)); setBuilding(item.building); setFloor(item.floor == null ? '' : String(item.floor)); };
  const submit = async () => {
    const cleanName = name.trim();
    if (cleanName.length < 2) {
      setError('Nama lab minimal 2 karakter.'); return;
    }
    if (!latitude.trim() || !longitude.trim() || !radius.trim()) {
      setError('Latitude, longitude, dan radius wajib diisi.'); return;
    }
    const lat = Number(latitude), lng = Number(longitude), r = Number(radius), f = floor.trim() ? Number(floor) : null;
    if (!building.trim() || !Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180 || !Number.isFinite(r) || r < 1 || r > 5000 || (f != null && !Number.isInteger(f))) {
      setError('Periksa nama, gedung, koordinat, radius (1–5000 m), dan lantai.'); return;
    }
    setBusy(true); setError('');
    try {
      await saveLabLocation({ name: cleanName, latitude: lat, longitude: lng, radiusMeters: r, building: building.trim(), floor: f, plusCode: editing?.plusCode ?? '' }, editing?.id);
      reset();
    } catch (e) { setError(e instanceof Error ? e.message : 'Lokasi gagal disimpan.'); }
    finally { setBusy(false); }
  };
  return (
    <View style={styles.page}>
      <ScreenHeader
        title="Lokasi laboratorium"
        subtitle="Atur titik lokasi dan radius presensi dalam meter."
        roleLabel="Aslab"
        greeting={profileName}
        initials={initialsFor(profileName)}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.heading}>{editing ? 'Ubah lokasi' : 'Tambah lokasi'}</Text>
          <Field label="Nama lab" value={name} onChangeText={setName} placeholder="Lab Informatika B" />
          <Field label="Gedung" value={building} onChangeText={setBuilding} placeholder="Gedung E FSM UNDIP" />
          <View style={styles.row}>
            <Field label="Latitude" value={latitude} onChangeText={setLatitude} keyboardType="decimal-pad" placeholder="-7.0482375" />
            <Field label="Longitude" value={longitude} onChangeText={setLongitude} keyboardType="decimal-pad" placeholder="110.440765625" />
          </View>
          <View style={styles.row}>
            <Field label="Radius presensi (m)" value={radius} onChangeText={setRadius} keyboardType="decimal-pad" placeholder="100" />
            <Field label="Lantai (opsional)" value={floor} onChangeText={setFloor} keyboardType="number-pad" placeholder="2" />
          </View>
          {!!error && <Text style={styles.error}>{error}</Text>}
          <View style={styles.row}>
            <Pressable disabled={busy} onPress={submit} style={styles.button}>
              <Text style={styles.buttonText}>
                {busy ? 'Menyimpan…' : editing ? 'Simpan perubahan' : 'Simpan lokasi'}
              </Text>
            </Pressable>
            {editing && (
              <Pressable onPress={reset} style={styles.secondary}>
                <Text style={styles.secondaryText}>Batal</Text>
              </Pressable>
            )}
          </View>
        </View>
        {locations.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.heading}>{item.name}</Text>
            <Text style={styles.muted}>
              {item.building}{item.floor == null ? '' : ` · Lantai ${item.floor}`}
            </Text>
            <Text style={styles.detail}>
              {item.latitude}, {item.longitude} · radius {item.radiusMeters} m
            </Text>
            <Text style={styles.detail}>
              Plus Code: {item.plusCode || 'belum diisi'} · referensi gedung
            </Text>
            <View style={styles.row}>
              <Pressable onPress={() => edit(item)} style={styles.secondary}>
                <Text style={styles.secondaryText}>Ubah</Text>
              </Pressable>
              <Pressable
                onPress={() => setDeleteTarget(item)}
                style={styles.delete}
              >
                <Text style={styles.deleteText}>Hapus</Text>
              </Pressable>
            </View>
          </View>
        ))}
        {locations.length === 0 && <Text style={styles.muted}>Belum ada lokasi tersimpan.</Text>}
      </ScrollView>
      <ConfirmationModal
        visible={deleteTarget !== null}
        title="Hapus lokasi laboratorium?"
        description={deleteTarget ? `${deleteTarget.name} akan dihapus dari daftar lokasi.` : ''}
        confirmLabel={busy ? 'Menghapus…' : 'Hapus lokasi'}
        eyebrow="KONFIRMASI HAPUS"
        confirmTestID="confirm-delete-lab-location"
        cancelTestID="cancel-delete-lab-location"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget || busy) return;
          const target = deleteTarget;
          setBusy(true); setError('');
          void removeLabLocation(target.id)
            .then(() => setDeleteTarget(null))
            .catch((e) => setError(e instanceof Error ? e.message : 'Lokasi gagal dihapus.'))
            .finally(() => setBusy(false));
        }}
      />
    </View>
  );
}

function Field(props: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; keyboardType?: 'decimal-pad' | 'number-pad' }) {
  return <View style={styles.field}><Text style={styles.label}>{props.label}</Text><TextInput value={props.value} onChangeText={props.onChangeText} placeholder={props.placeholder} keyboardType={props.keyboardType} style={styles.input} /></View>;
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40, gap: 12 },
  muted: { color: colors.muted, lineHeight: 20 },
  card: { backgroundColor: colors.white, padding: 16, borderRadius: 16, gap: 10 },
  heading: { color: colors.navy, fontWeight: '800', fontSize: 17 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  field: { flex: 1, gap: 5 },
  label: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 10,
    color: colors.navy,
    backgroundColor: colors.white,
  },
  detail: { color: colors.navy, fontSize: 13 },
  button: { backgroundColor: colors.blue, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12 },
  buttonText: { color: colors.white, fontWeight: '800' },
  secondary: { alignSelf: 'flex-start', backgroundColor: colors.paleBlue, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  secondaryText: { color: colors.navy, fontWeight: '700' },
  delete: { alignSelf: 'flex-start', backgroundColor: '#FCE8E8', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  deleteText: { color: colors.danger, fontWeight: '700' },
  error: { color: colors.danger, fontSize: 13 },
});
