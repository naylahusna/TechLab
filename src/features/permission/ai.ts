import type { Classification } from './model';

export function parseClassification(
  data: unknown,
): Pick<Classification, 'aiCategory' | 'aiConfidence'> {
  // Supported JSON contracts. No category is guessed from the applicant's text.
  let value = data;
  if (Array.isArray(value) && Array.isArray(value[0])) value = value[0];
  if (Array.isArray(value)) {
    value = [...value].sort(
      (a, b) => Number(b?.score ?? b?.confidence ?? 0) - Number(a?.score ?? a?.confidence ?? 0),
    )[0];
  }
  if (!value || typeof value !== 'object') throw new Error('Format hasil AI tidak dikenali.');
  const record = value as Record<string, unknown>;
  const category = record.category ?? record.label;
  const confidence = record.confidence ?? record.score;
  if (typeof category !== 'string' || !category.trim() || category.length > 100)
    throw new Error('Kategori AI tidak valid.');
  if (
    confidence != null &&
    (typeof confidence !== 'number' ||
      !Number.isFinite(confidence) ||
      confidence < 0 ||
      confidence > 1)
  )
    throw new Error('Nilai keyakinan AI tidak valid.');
  return {
    aiCategory: category.trim(),
    aiConfidence: typeof confidence === 'number' ? confidence : null,
  };
}

export function createPermissionClassifier({
  endpoint,
  timeoutMs = 15000,
  fetcher = fetch,
}: { endpoint?: string; timeoutMs?: number; fetcher?: typeof fetch } = {}) {
  return async (reason: string, consent: boolean): Promise<Classification> => {
    const base = { aiCategory: null, aiConfidence: null, aiSource: null };
    if (!consent)
      return {
        ...base,
        aiStatus: 'unavailable',
        aiError: 'Klasifikasi tidak diminta. Asisten dapat memeriksa alasan secara manual.',
      };
    if (!endpoint)
      return {
        ...base,
        aiStatus: 'unavailable',
        aiError: 'API AI pengajar belum dikonfigurasi. Pengajuan tetap dapat ditinjau manual.',
      };
    let url: URL;
    try {
      url = new URL(endpoint);
      if (
        url.protocol !== 'https:' &&
        !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '10.0.2.2'].includes(url.hostname))
      )
        throw new Error();
      if (url.username || url.password || url.search) throw new Error();
    } catch {
      return {
        ...base,
        aiStatus: 'unavailable',
        aiError: 'Alamat layanan AI belum valid. Hubungi pengelola.',
      };
    }
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(new Error('timeout'));
      }, timeoutMs);
    });
    try {
      const result = await Promise.race([
        (async () => {
          const response = await fetcher(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Only the reason is transmitted; never UID, name, email or attachments.
            body: JSON.stringify({ text: reason }),
            signal: controller.signal,
          });
          if (!response.ok) throw new Error('AI service error');
          return parseClassification(await response.json());
        })(),
        timeout,
      ]);
      return {
        ...result,
        aiStatus: 'completed',
        aiSource: url.origin + url.pathname,
        aiError: null,
      };
    } catch {
      return {
        ...base,
        aiStatus: 'failed',
        aiSource: url.origin + url.pathname,
        aiError: controller.signal.aborted
          ? 'Layanan AI tidak merespons tepat waktu. Silakan tinjau manual atau coba lagi.'
          : 'Klasifikasi AI gagal atau respons tidak valid. Pengajuan tetap tersimpan untuk tinjauan manual.',
      };
    } finally {
      clearTimeout(timer);
    }
  };
}

export const classifyPermission = createPermissionClassifier({
  endpoint: process.env.EXPO_PUBLIC_PERMISSION_AI_URL,
});
