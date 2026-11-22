import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '../components/Text';
import { useAuth } from '../features/auth/AuthProvider';
import { extractAttendanceCode, getQrSessionByCode } from '../features/attendance-qr/service';
import { practicumErrorMessage } from '../features/practicum';

export { extractAttendanceCode };

export default function QrAttendanceRoute() {
  const router = useRouter();
  const auth = useAuth();
  const { sessionId: expectedSessionId } = useLocalSearchParams<{ sessionId?: string | string[] }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [canRetry, setCanRetry] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [message, setMessage] = useState('Arahkan kamera ke barcode QR dari asisten, atau ketik kode di bawah.');
  const handled = useRef(false);

  useEffect(() => {
    if (!permission?.granted && permission?.canAskAgain !== false) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  async function scan(rawData: string) {
    if (handled.current || busy) return;
    const cleanCode = extractAttendanceCode(rawData);
    if (!cleanCode) {
      setMessage('Kode barcode kosong. Masukkan kode yang valid.');
      return;
    }

    if (!cleanCode.startsWith('TL-')) {
      setMessage('Barcode yang terdeteksi bukan kode presensi TechLab (harus diawali "TL-"). Arahkan kamera tepat ke QR code dari asisten.');
      handled.current = false;
      setCanRetry(true);
      return;
    }

    handled.current = true;
    setBusy(true);
    setMessage('Memeriksa barcode presensi…');
    try {
      if (auth.profile?.role !== 'praktikan') {
        throw new Error('Login sebagai praktikan untuk melakukan presensi.');
      }
      const { sessionId } = await getQrSessionByCode(cleanCode);
      const expected = Array.isArray(expectedSessionId) ? expectedSessionId[0] : expectedSessionId;
      if (expected && expected !== sessionId) {
        throw new Error('Barcode QR ini untuk sesi praktikum yang berbeda dari sesi yang kamu buka.');
      }

      setMessage('Barcode valid. Mengalihkan ke halaman presensi…');
      setCanRetry(false);
      router.replace({ pathname: '/sesi/[id]/presensi', params: { id: sessionId, qrCode: cleanCode } });
    } catch (cause) {
      handled.current = false;
      setCanRetry(true);
      const err = cause as { code?: string; message?: string };
      if (err?.code === 'permission-denied') {
        setMessage('Akses ditolak oleh Firebase. Pastikan asisten sudah membuka sesi praktikum ini dan barcode QR masih aktif.');
      } else {
        setMessage(practicumErrorMessage(cause));
      }
      setBusy(false);
    }
  }

  if (!auth.profile) {
    return (
      <View style={styles.screen}>
        <Text style={styles.message}>Silakan login terlebih dahulu.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.screen}>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace('/jadwal');
            }}
            style={styles.backButton}
          >
            <Text style={styles.back}>← Kembali</Text>
          </Pressable>
          <Text style={styles.title}>Scan Barcode Presensi</Text>
          <Text style={styles.copy}>
            Pindai barcode QR aktif dari asisten praktikum. Jika kamera tidak dapat memindai, kamu juga dapat memasukkan kode presensi secara manual.
          </Text>

          {!permission?.granted ? (
            <View style={styles.permissionCard}>
              <Text style={styles.permissionTitle}>Izin Kamera Diperlukan</Text>
              <Text style={styles.permissionCopy}>
                Aplikasi memerlukan akses kamera untuk membaca barcode QR presensi.
              </Text>
              {permission?.canAskAgain === false ? (
                <Pressable style={styles.button} onPress={() => void Linking.openSettings()}>
                  <Text style={styles.buttonText}>Buka Pengaturan Perangkat</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.button} onPress={() => void requestPermission()}>
                  <Text style={styles.buttonText}>Aktifkan Kamera</Text>
                </Pressable>
              )}
            </View>
          ) : null}

          {permission?.granted && !busy ? (
            <View style={styles.cameraContainer}>
              <View style={styles.camera}>
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  barcodeScannerSettings={{
                    barcodeTypes: [
                      'qr',
                      'code128',
                      'code39',
                      'code93',
                      'ean13',
                      'ean8',
                      'upc_a',
                      'upc_e',
                      'pdf417',
                      'aztec',
                      'datamatrix',
                    ],
                  }}
                  onBarcodeScanned={({ data }) => {
                    void scan(data);
                  }}
                />
                <View style={styles.overlayFrame} />
              </View>
            </View>
          ) : null}

          {busy ? (
            <View style={styles.busyContainer}>
              <ActivityIndicator size="large" color="#14532d" />
              <Text style={styles.busyText}>Memverifikasi barcode…</Text>
            </View>
          ) : null}

          <View style={[styles.statusBox, canRetry ? styles.statusBoxError : styles.statusBoxInfo]}>
            <Text style={[styles.message, canRetry ? styles.messageError : styles.messageInfo]}>
              {message}
            </Text>
          </View>

          {!busy && canRetry ? (
            <Pressable
              style={styles.retryButton}
              onPress={() => {
                setCanRetry(false);
                setMessage('Arahkan kamera ke barcode QR dari asisten, atau ketik kode di bawah.');
              }}
            >
              <Text style={styles.retryButtonText}>Coba Scan Lagi</Text>
            </Pressable>
          ) : null}

          <View style={styles.manualCard}>
            <Text style={styles.manualTitle}>Atau Masukkan Kode Presensi</Text>
            <Text style={styles.manualSubtitle}>
              Ketik kode yang tertera di bawah QR asisten (contoh: TL-M8ABC123-ABCDEFGH)
            </Text>
            <TextInput
              style={styles.input}
              value={manualCode}
              onChangeText={setManualCode}
              placeholder="Contoh: TL-M8ABC123-ABCDEFGH"
              placeholderTextColor="#94a3b8"
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!busy}
            />
            <Pressable
              style={[styles.button, (!manualCode.trim() || busy) && styles.buttonDisabled]}
              disabled={!manualCode.trim() || busy}
              onPress={() => void scan(manualCode)}
            >
              <Text style={styles.buttonText}>Verifikasi Kode</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1 },
  screen: { flex: 1, backgroundColor: '#f8fafc', padding: 20, gap: 14, maxWidth: 640, width: '100%', alignSelf: 'center' },
  backButton: { alignSelf: 'flex-start', paddingVertical: 6, paddingRight: 12 },
  back: { color: '#14532d', fontWeight: '700', fontSize: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  copy: { fontSize: 14, color: '#475569', lineHeight: 20 },
  permissionCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  permissionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  permissionCopy: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 18 },
  cameraContainer: { width: '100%', alignItems: 'center' },
  camera: {
    width: '100%',
    height: 320,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayFrame: {
    width: 220,
    height: 220,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  busyContainer: { alignItems: 'center', padding: 12, gap: 8 },
  busyText: { color: '#14532d', fontWeight: '600', fontSize: 14 },
  statusBox: { padding: 14, borderRadius: 12, borderWidth: 1 },
  statusBoxInfo: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  statusBoxError: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  message: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  messageInfo: { color: '#166534' },
  messageError: { color: '#991b1b', fontWeight: '600' },
  retryButton: {
    backgroundColor: '#e2e8f0',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  retryButtonText: { color: '#1e293b', fontWeight: '700', fontSize: 14 },
  manualCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 6,
  },
  manualTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  manualSubtitle: { fontSize: 13, color: '#64748b', lineHeight: 18 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    letterSpacing: 1,
  },
  button: {
    backgroundColor: '#14532d',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: '#94a3b8' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
