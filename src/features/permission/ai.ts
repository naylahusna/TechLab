import { permissionKinds, type Classification } from './model';

const empty = { aiCategory: null, aiConfidence: null, aiSource: null } as const;

export function parseClassification(value: unknown): Classification {
  if (!value || typeof value !== 'object') throw new Error('Format hasil AI tidak dikenali.');
  const data = value as Record<string, unknown>;
  if (!['completed', 'failed', 'unavailable'].includes(String(data.aiStatus)) ||
      data.aiConfidence !== null || typeof data.aiSource !== 'string' || data.aiSource.length > 500)
    throw new Error('Metadata klasifikasi AI tidak valid.');
  const source = new URL(data.aiSource);
  if (source.protocol !== 'https:' || source.username || source.password || source.search)
    throw new Error('Sumber AI tidak valid.');
  if (data.aiStatus === 'completed') {
    if (typeof data.aiCategory !== 'string' || !Object.hasOwn(permissionKinds, data.aiCategory) ||
        data.aiError !== null) throw new Error('Kategori alasan izin tidak valid.');
    return { ...empty, aiStatus: 'completed', aiCategory: data.aiCategory, aiSource: data.aiSource, aiError: null };
  }
  if (data.aiCategory !== null || typeof data.aiError !== 'string' || !data.aiError || data.aiError.length > 300)
    throw new Error('Status kegagalan AI tidak valid.');
  return {
    ...empty, aiStatus: data.aiStatus as 'failed' | 'unavailable',
    aiSource: data.aiSource, aiError: data.aiError,
  };
}

function endpointUrl(endpoint: string) {
  const url = new URL(endpoint);
  // HTTP is only for the private development server on a laptop/LAN.
  const privateHost = ['localhost', '127.0.0.1', '10.0.2.2'].includes(url.hostname) ||
    /^10\.\d+\.\d+\.\d+$/.test(url.hostname) || /^192\.168\.\d+\.\d+$/.test(url.hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(url.hostname);
  if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && privateHost)) ||
      url.username || url.password || url.search || url.hash)
    throw new Error('Alamat perantara AI tidak valid.');
  return url;
}

export function createPermissionClassifier({
  endpoint, timeoutMs = 45000, fetcher = fetch,
}: { endpoint?: string; timeoutMs?: number; fetcher?: typeof fetch } = {}) {
  return async (permissionId: string, consent: boolean, idToken: string): Promise<Classification> => {
    if (!consent || !endpoint) return {
      ...empty, aiStatus: 'unavailable',
      aiError: !consent ? 'Analisis AI tidak disetujui. Asisten dapat meninjau secara manual.'
        : 'Perantara AI belum dikonfigurasi. Pengajuan tetap dapat ditinjau manual.',
    };
    try { endpointUrl(endpoint); }
    catch { return { ...empty, aiStatus: 'unavailable', aiError: 'Alamat perantara AI belum valid. Hubungi pengelola.' }; }
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => { controller.abort(); reject(new Error('timeout')); }, timeoutMs);
    });
    try {
      return await Promise.race([
        (async () => {
          if (!idToken) throw new Error('Login diperlukan.');
          const response = await fetcher(endpoint, {
            method: 'POST', signal: controller.signal, redirect: 'error',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
            // The intermediary reads the stored reason under the caller's Firestore permissions.
            body: JSON.stringify({ permissionId }),
          });
          if (!response.ok) throw new Error('AI intermediary unavailable');
          return parseClassification(await response.json());
        })(), timeout,
      ]);
    } catch {
      return {
        ...empty, aiStatus: 'failed',
        aiError: controller.signal.aborted
          ? 'Analisis AI tidak merespons tepat waktu. Pengajuan tetap tersedia untuk tinjauan manual.'
          : 'Analisis AI belum berhasil. Periksa koneksi atau coba lagi nanti. Pengajuan tetap tersimpan.',
      };
    } finally { clearTimeout(timer); }
  };
}

export const permissionAiConfigured = !!process.env.EXPO_PUBLIC_PERMISSION_AI_URL;
export const classifyPermission = createPermissionClassifier({
  endpoint: process.env.EXPO_PUBLIC_PERMISSION_AI_URL,
});
