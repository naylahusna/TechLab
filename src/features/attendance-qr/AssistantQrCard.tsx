import { useEffect, useState } from 'react';
import { Alert, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Text } from '../../components/Text';
import { createQr, disableQr, qrPayload } from './service';

export function AssistantQrCard({ sessionId, practicalName, lab, schedule }: { sessionId: string; practicalName: string; lab: string; schedule?: string }) {
  const [token, setToken] = useState('');
  const [state, setState] = useState<'idle' | 'active' | 'disabled' | 'expired'>('idle');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [qrRef, setQrRef] = useState<{ toDataURL: (callback: (data: string) => void) => void } | null>(null);
  async function generate() {
    setBusy(true); setError('');
    try { const result = await createQr(sessionId); setToken(result.token); setState('active'); setRemaining(result.expiresAt ? Math.max(0, Date.parse(result.expiresAt) - Date.now()) : 0); }
    catch (e) { setError((e as Error).message || 'QR tidak dapat dibuat.'); }
    finally { setBusy(false); }
  }
  useEffect(() => { if (state !== 'active' || !remaining) return; const timer = setInterval(() => setRemaining((value) => { if (value <= 1000) { setState('expired'); return 0; } return value - 1000; }), 1000); return () => clearInterval(timer); }, [state, remaining > 0]);
  async function disable() { setBusy(true); try { await disableQr(sessionId); setState('disabled'); setToken(''); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }
  async function download() {
    if (!qrRef || Platform.OS === 'web') { Alert.alert('Unduh QR Code', 'Untuk menyimpan QR di desktop, gunakan menu cetak atau tangkapan layar.'); return; }
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) throw new Error('Fitur berbagi file tidak tersedia di perangkat ini.');
      qrRef.toDataURL(async (base64) => {
        const uri = `${FileSystem.cacheDirectory}attendance-${sessionId}.png`;
        await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Simpan QR Presensi' });
      });
    } catch (e) { setError((e as Error).message || 'QR tidak dapat disimpan.'); }
  }
  const countdown = `${Math.floor(remaining / 60000).toString().padStart(2, '0')}:${Math.floor((remaining % 60000) / 1000).toString().padStart(2, '0')}`;
  return <View style={styles.card}>
    <Text style={styles.title}>Generate Attendance QR</Text>
    <Text style={styles.meta}>{practicalName} · {lab}{schedule ? ` · ${schedule}` : ''}</Text>
    {token ? <View style={styles.qr}><QRCode value={qrPayload(token)} size={220} getRef={(ref) => setQrRef(ref)} /></View> : null}
    <Text style={[styles.state, state === 'active' ? styles.green : state === 'expired' ? styles.red : styles.gray]}>STATUS: {state.toUpperCase()} {state === 'active' ? `· ${countdown}` : ''}</Text>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <View style={styles.actions}>
      <Pressable disabled={busy} onPress={generate} style={styles.primary}><Text style={styles.buttonText}>{token ? 'Regenerate QR Code' : 'Generate QR Code'}</Text></Pressable>
      {state === 'active' ? <Pressable disabled={busy} onPress={disable} style={styles.secondary}><Text style={styles.secondaryText}>Disable QR Code</Text></Pressable> : null}
      {state === 'active' ? <Pressable onPress={() => setFullscreen(true)} style={styles.secondary}><Text style={styles.secondaryText}>Fullscreen Display</Text></Pressable> : null}
      {state === 'active' ? <Pressable onPress={download} style={styles.secondary}><Text style={styles.secondaryText}>Download QR Code</Text></Pressable> : null}
    </View>
    <Modal visible={fullscreen} animationType="fade" onRequestClose={() => setFullscreen(false)}><View style={styles.fullscreen}><Text style={styles.title}>{practicalName}</Text><Text style={styles.meta}>{lab} · {sessionId}</Text><QRCode value={qrPayload(token)} size={300} /><Text style={styles.state}>ACTIVE · {countdown}</Text><Pressable onPress={() => setFullscreen(false)} style={styles.primary}><Text style={styles.buttonText}>Tutup</Text></Pressable></View></Modal>
  </View>;
}
const styles = StyleSheet.create({ card:{backgroundColor:'#fff',borderRadius:18,padding:20,margin:16,gap:12,borderWidth:1,borderColor:'#e5e7eb'},title:{fontSize:20,fontWeight:'700',color:'#12243a'},meta:{color:'#64748b'},qr:{alignSelf:'center',padding:14,backgroundColor:'#fff'},state:{fontWeight:'700',textAlign:'center'},green:{color:'#15803d'},red:{color:'#dc2626'},gray:{color:'#64748b'},actions:{gap:8},primary:{backgroundColor:'#14532d',padding:14,borderRadius:10,alignItems:'center'},buttonText:{color:'#fff',fontWeight:'700'},secondary:{padding:12,borderRadius:10,borderWidth:1,borderColor:'#cbd5e1',alignItems:'center'},secondaryText:{color:'#334155',fontWeight:'600'},error:{color:'#b91c1c'},fullscreen:{flex:1,backgroundColor:'#fff',alignItems:'center',justifyContent:'center',gap:22,padding:24} });
