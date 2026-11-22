import { getFirebaseAuth } from '../../services/firebase/auth';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { resolveDevelopmentHost } from '../../services/firebase/development-host';

function getBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_ATTENDANCE_API_URL;
  if (configured) return configured.replace(/\/$/, '');
  if (Platform.OS !== 'web' && Constants.expoConfig?.hostUri) {
    const host = resolveDevelopmentHost('127.0.0.1', Constants.expoConfig.hostUri);
    return `http://${host}:8788`;
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined') return `http://${window.location.hostname}:8788`;
  return 'http://127.0.0.1:8788';
}

type ApiErrorBody = { code?: string; message?: string };

async function attendanceRequest<T>(path: string, payload: Record<string, unknown>): Promise<T> {
  const baseUrl = getBaseUrl();
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('Silakan login terlebih dahulu.');
  const idToken = await user.getIdToken();
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/attendance/${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(`Attendance API tidak dapat dihubungi di ${baseUrl}. Pastikan server aktif dan URL dapat diakses perangkat.`);
  }
  const body = await response.json().catch(() => ({})) as T & ApiErrorBody;
  if (!response.ok) throw Object.assign(new Error(body.message || 'Permintaan presensi gagal.'), { code: body.code, status: response.status });
  return body;
}

export function createQr(sessionId: string) {
  return attendanceRequest<{ qrDataUrl: string; expiresAt: string; status: 'active' }>('qr', { sessionId });
}

export function disableQr(sessionId: string) {
  return attendanceRequest<{ ok: boolean }>('disable', { sessionId });
}

export function closeQrSession(sessionId: string) {
  return attendanceRequest<{ ok: boolean }>('close', { sessionId });
}

export function verifyQrAttendance(token: string) {
  return attendanceRequest<{ valid: true; alreadyRecorded: boolean; attendanceTime: string | null; session: { id: string; practicalSubject: string; className: string; laboratory: string; startAt: string; endAt: string } }>('verify', { token });
}

export function recordQrAttendance(token: string) {
  return attendanceRequest<{ sessionId: string; attendanceTime: string | null; name?: string; nim?: string; alreadyRecorded: boolean }>('submit', { token });
}
