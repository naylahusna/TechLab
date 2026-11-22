import { useState } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '../components/Text';
import { useAuth } from '../features/auth/AuthProvider';
import { recordQrAttendance } from '../features/attendance-qr/service';

export default function QrAttendanceRoute() {
  const router = useRouter();
  const auth = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string; detail?: string } | null>(null);
  async function scan(data: string) {
    if (busy || result) return;
    setBusy(true);
    try {
      const match = data.match(/^techlab:\/\/attendance\?token=(.+)$/);
      if (!match) throw new Error('QR Code tidak valid.');
      const payload = await recordQrAttendance(decodeURIComponent(match[1]));
      const time = payload.attendanceTime ? new Date(payload.attendanceTime).toLocaleString('id-ID') : 'Waktu tidak tersedia';
      setResult({ ok: true, message: payload.alreadyRecorded ? 'ALREADY RECORDED' : 'ATTENDANCE SUCCESSFUL', detail: payload.alreadyRecorded ? `Presensi sebelumnya tercatat pada ${time}.` : `${payload.name} · ${payload.nim} · ${time}` });
    } catch (e) {
      const message = (e as { message?: string }).message ?? '';
      const already = message.includes('already-exists') || message.includes('ALREADY_RECORDED');
      setResult({ ok: already, message: already ? 'ALREADY RECORDED' : message.includes('deadline-exceeded') ? 'SESI SUDAH BERAKHIR' : message.includes('permission-denied') ? 'PRAKTIKAN TIDAK TERDAFTAR' : 'QR CODE TIDAK VALID', detail: already ? 'Presensi sebelumnya sudah tercatat.' : 'Periksa sesi QR dan coba kembali.' });
    } finally { setBusy(false); }
  }
  if (!auth.profile) return <View style={styles.screen}><Text>Silakan login terlebih dahulu.</Text></View>;
  return <View style={styles.screen}>
    <Pressable onPress={() => router.back()}><Text style={styles.back}>← Kembali</Text></Pressable>
    <Text style={styles.title}>QR Attendance Scanner</Text>
    <Text style={styles.copy}>Arahkan kamera ke QR Code aktif yang ditampilkan asisten.</Text>
    {!permission?.granted ? <Pressable style={styles.button} onPress={requestPermission}><Text style={styles.buttonText}>{permission?.canAskAgain === false ? 'Izinkan kamera di pengaturan perangkat' : 'Aktifkan Kamera'}</Text></Pressable> : null}
    {permission?.granted && !result ? <View style={styles.camera}><CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={({ data }) => scan(data)} /></View> : null}
    {busy ? <Text style={styles.copy}>Memverifikasi presensi…</Text> : null}
    {result ? <View style={[styles.result, result.ok ? styles.success : styles.failure]}><Text style={styles.resultTitle}>{result.message}</Text><Text>{result.detail}</Text>{result.ok && result.message !== 'ALREADY RECORDED' ? <Text style={styles.present}>PRESENT</Text> : null}<Pressable style={styles.button} onPress={() => { setResult(null); }}><Text style={styles.buttonText}>Scan lagi</Text></Pressable></View> : null}
  </View>;
}
const styles = StyleSheet.create({screen:{flex:1,backgroundColor:'#f5f7fa',padding:20,gap:14},back:{color:'#14532d',fontWeight:'600'},title:{fontSize:26,fontWeight:'700',color:'#12243a'},copy:{fontSize:15,color:'#64748b'},camera:{width:'100%',maxWidth:500,height:420,alignSelf:'center',overflow:'hidden',borderRadius:18,backgroundColor:'#111'},button:{backgroundColor:'#14532d',padding:14,borderRadius:10,alignItems:'center'},buttonText:{color:'#fff',fontWeight:'700'},result:{padding:20,borderRadius:16,gap:10,alignItems:'center'},success:{backgroundColor:'#dcfce7'},failure:{backgroundColor:'#fee2e2'},resultTitle:{fontSize:21,fontWeight:'800'},present:{fontWeight:'800',color:'#15803d'}});
