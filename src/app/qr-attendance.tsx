import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '../components/Text';
import { useAuth } from '../features/auth/AuthProvider';
import { getQrSessionByCode } from '../features/attendance-qr/service';
import { practicumErrorMessage } from '../features/practicum';

export default function QrAttendanceRoute() {
  const router = useRouter();
  const auth = useAuth();
  const { sessionId: expectedSessionId } = useLocalSearchParams<{ sessionId?: string | string[] }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [canRetry, setCanRetry] = useState(false);
  const [message, setMessage] = useState('Arahkan kamera ke barcode QR dari asisten.');
  const handled = useRef(false);

  async function scan(data: string) {
    if (handled.current || busy) return;
    handled.current = true;
    setBusy(true);
    setMessage('Memeriksa QR presensi…');
    try {
      if (auth.profile?.role !== 'praktikan') throw new Error('Login sebagai praktikan untuk melakukan presensi.');
      const { sessionId } = await getQrSessionByCode(data.trim());
      const expected = Array.isArray(expectedSessionId) ? expectedSessionId[0] : expectedSessionId;
      if (expected && expected !== sessionId) throw new Error('QR ini bukan untuk sesi yang sedang kamu buka.');

      setMessage('QR valid. Lanjutkan untuk validasi lokasi dan mencatat presensi.');
      setCanRetry(false);
      router.replace({ pathname: '/sesi/[id]/presensi', params: { id: sessionId, qrCode: data.trim() } });
    } catch (cause) {
      handled.current = false;
      setCanRetry(true);
      setMessage((cause as { code?: string })?.code === 'permission-denied'
        ? 'Firebase menolak akses QR. Pastikan Firestore Rules terbaru sudah di-deploy dan akun praktikan aktif sebagai anggota kelas.'
        : practicumErrorMessage(cause));
      setBusy(false);
    }
  }

  if (!auth.profile) return <View style={styles.screen}><Text>Silakan login terlebih dahulu.</Text></View>;
  return <View style={styles.screen}>
    <Pressable onPress={() => router.back()}><Text style={styles.back}>← Kembali</Text></Pressable>
    <Text style={styles.title}>Scan Barcode Presensi</Text>
    <Text style={styles.copy}>Pindai QR aktif dari asisten. Presensi dicatat setelah kode dan lokasi kamu berhasil diverifikasi.</Text>
    {!permission?.granted ? <Pressable style={styles.button} onPress={requestPermission}><Text style={styles.buttonText}>{permission?.canAskAgain === false ? 'Izinkan kamera di pengaturan perangkat' : 'Aktifkan Kamera'}</Text></Pressable> : null}
    {permission?.granted && !busy ? <View style={styles.camera}><CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={({ data }) => { void scan(data); }} /></View> : null}
    {busy ? <ActivityIndicator size="large" color="#14532d" /> : null}
    <Text style={styles.message}>{message}</Text>
    {!busy && canRetry ? <Pressable style={styles.button} onPress={() => { setCanRetry(false); setMessage('Arahkan kamera ke barcode QR dari asisten.'); }}><Text style={styles.buttonText}>Scan lagi</Text></Pressable> : null}
  </View>;
}

const styles = StyleSheet.create({screen:{flex:1,backgroundColor:'#f5f7fa',padding:20,gap:14},back:{color:'#14532d',fontWeight:'600'},title:{fontSize:26,fontWeight:'700',color:'#12243a'},copy:{fontSize:15,color:'#64748b'},camera:{width:'100%',maxWidth:500,height:420,alignSelf:'center',overflow:'hidden',borderRadius:18,backgroundColor:'#111'},button:{backgroundColor:'#14532d',padding:14,borderRadius:10,alignItems:'center'},buttonText:{color:'#fff',fontWeight:'700'},message:{padding:12,textAlign:'center',color:'#334155'}});
