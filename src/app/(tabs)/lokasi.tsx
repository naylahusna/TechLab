import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Text } from '../../components/Text';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { useAuth } from '../../features/auth/AuthProvider';
import { type LabLocation, archiveLabLocation, saveLabLocation, watchAslabCourses, watchScopedLabLocations } from '../../features/assistant/lab-locations';
import { ScreenHeader } from '../../features/practitioner/components/ScreenHeader';
import { labHasName } from '../../features/assistant/lab-location-policy';
import { getPracticumRepository } from '../../features/practicum/client';
import { initialsFor } from '../../features/practicum/profile-view';
import { colors } from '../../theme/tokens';

export default function LabLocationsRoute() {
  const { profile } = useAuth();
  if (profile?.role !== 'admin') {
    return <View style={styles.page}><Text>Halaman ini hanya untuk Aslab.</Text></View>;
  }
  return <LabLocations key={profile.uid} uid={profile.uid} name={profile.name} />;
}

function LabLocations({ uid, name: profileName }: { uid: string; name: string }) {
  const [locations, setLocations] = useState<LabLocation[]>([]);
  const [courses, setCourses] = useState<string[]>([]);
  const [courseName, setCourseName] = useState('');
  const [editing, setEditing] = useState<LabLocation | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<LabLocation | null>(null);
  const [archiveImpact, setArchiveImpact] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radius, setRadius] = useState('100');
  const [graceMinutes, setGraceMinutes] = useState('0');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    return watchScopedLabLocations(uid, setLocations, (e) => setError(e.message));
  }, [uid]);
  useEffect(() => watchAslabCourses(uid, setCourses, (e) => setError(e.message)), [uid]);
  const reset = () => { setEditing(null); setCourseName(''); setName(''); setLatitude(''); setLongitude(''); setRadius('100'); setGraceMinutes('0'); setBuilding(''); setFloor(''); };
  const edit = (item: LabLocation) => { setEditing(item); setCourseName(item.courseName); setName(item.name); setLatitude(String(item.latitude)); setLongitude(String(item.longitude)); setRadius(String(item.radiusMeters)); setGraceMinutes(String(item.graceMinutes)); setBuilding(item.building); setFloor(item.floor == null ? '' : String(item.floor)); };
  const submit = async () => {
    const selectedCourse = courseName.trim() || (courses.length === 1 ? courses[0] : '');
    if (!courses.includes(selectedCourse)) {
      setError('Pilih mata kuliah dalam cakupan penugasanmu.'); return;
    }
    if (busy) return;
    if (!latitude.trim() || !longitude.trim() || !radius.trim() || !graceMinutes.trim()) {
      setError('Latitude, longitude, radius, dan toleransi wajib diisi.'); return;
    }
    setBusy(true); setError('');
    try {
      await saveLabLocation({
        courseName: selectedCourse, name, latitude: Number(latitude), longitude: Number(longitude),
        radiusMeters: Number(radius), graceMinutes: Number(graceMinutes), building,
        floor: floor.trim() ? Number(floor) : null, plusCode: editing?.plusCode ?? '',
      }, editing?.id);
      reset();
    } catch (e) { setError(e instanceof Error ? e.message : 'Lokasi gagal disimpan.'); }
    finally { setBusy(false); }
  };
  async function previewArchive(item: LabLocation) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const repo = getPracticumRepository();
      const classes = await repo.listClassesForAslab([item.courseName]);
      const schedules = (await Promise.all(classes.map((course) => repo.listSchedules(course.id)))).flat();
      setArchiveImpact(schedules.filter((schedule) =>
        !schedule.archivedAt && schedule.endAt.toMillis() > Date.now() && labHasName(item, schedule.location)).length);
      setArchiveTarget(item);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Jadwal terkait gagal diperiksa.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.page}>
      <ScreenHeader
        title="Lokasi laboratorium"
        subtitle="Kelola koordinat, radius presensi, dan toleransi lab."
        roleLabel="Aslab"
        greeting={profileName}
        initials={initialsFor(profileName)}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.heading}>{editing ? 'Ubah lokasi' : 'Tambah lokasi'}</Text>
          {editing ? <Text>{editing.courseName}</Text> : (
            <View style={styles.field}>
              <Text style={styles.label}>Mata kuliah</Text>
              {courses.length === 0 && <Text style={styles.muted}>Belum ada cakupan mata kuliah.</Text>}
              {courses.map((course) => (
                <Pressable key={course} onPress={() => setCourseName(course)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: course === courseName || courses.length === 1 }}
                  style={course === courseName || courses.length === 1 ? styles.button : styles.secondary}>
                  <Text style={course === courseName || courses.length === 1 ? styles.buttonText : styles.secondaryText}>{course}</Text>
                </Pressable>
              ))}
            </View>
          )}
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
          <Field label="Toleransi keterlambatan (menit)" value={graceMinutes} onChangeText={setGraceMinutes} keyboardType="number-pad" placeholder="0" />
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
            <Text style={styles.muted}>{item.courseName}</Text>
            <Text style={styles.muted}>
              {item.building}{item.floor == null ? '' : ` · Lantai ${item.floor}`}
            </Text>
            <Text style={styles.detail}>
              {item.latitude}, {item.longitude} · radius {item.radiusMeters} m · toleransi {item.graceMinutes} menit
            </Text>
            <Text style={styles.detail}>
              Plus Code: {item.plusCode || 'belum diisi'} · referensi gedung
            </Text>
            {item.archivedAt ? <Text style={styles.muted}>Diarsipkan</Text> : <View style={styles.row}>
              <Pressable disabled={busy} onPress={() => edit(item)} style={styles.secondary}>
                <Text style={styles.secondaryText}>Ubah</Text>
              </Pressable>
              <Pressable
                disabled={busy}
                onPress={() => { void previewArchive(item); }}
                style={styles.delete}
              >
                <Text style={styles.deleteText}>Arsipkan</Text>
              </Pressable>
            </View>}
          </View>
        ))}
        {locations.length === 0 && <Text style={styles.muted}>Belum ada lokasi tersimpan.</Text>}
      </ScrollView>
      <ConfirmationModal
        visible={archiveTarget !== null}
        title="Arsipkan lokasi laboratorium?"
        description={archiveTarget ? `${archiveTarget.name} dipakai oleh ${archiveImpact ?? 0} jadwal yang masih berlangsung atau akan datang. Jadwal tersebut tetap menyimpan lokasinya. Lab ini tidak lagi muncul sebagai pilihan baru atau marker Maps.` : ''}
        confirmLabel={busy ? 'Mengarsipkan…' : 'Arsipkan lokasi'}
        eyebrow="KONFIRMASI ARSIP"
        confirmTestID="confirm-delete-lab-location"
        cancelTestID="cancel-delete-lab-location"
        onCancel={() => setArchiveTarget(null)}
        onConfirm={() => {
          if (!archiveTarget || busy) return;
          const target = archiveTarget;
          setBusy(true); setError('');
          void archiveLabLocation(target.id)
            .then(() => {
              if (editing?.id === target.id) reset();
              setArchiveTarget(null);
            })
            .catch((e) => setError(e instanceof Error ? e.message : 'Lokasi gagal diarsipkan.'))
            .finally(() => setBusy(false));
        }}
      />
    </View>
  );
}

function Field(props: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; keyboardType?: 'decimal-pad' | 'number-pad' }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        accessibilityLabel={props.label}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={props.keyboardType}
        style={styles.input}
      />
    </View>
  );
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
