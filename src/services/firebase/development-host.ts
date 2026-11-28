export function isLocalHost(host: string) {
  if (['localhost', '127.0.0.1', '[::1]'].includes(host)) return true;
  const parts = host.split('.').map(Number);
  return /^\d+\.\d+\.\d+\.\d+$/.test(host) && parts.every((n) => n >= 0 && n <= 255) &&
    (parts[0] === 10 || (parts[0] === 192 && parts[1] === 168) ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31));
}

export function resolveDevelopmentHost(configured: string, hostUri?: string | null) {
  try {
    const host = new URL(hostUri?.includes('://') ? hostUri : `http://${hostUri}`).hostname;
    if (isLocalHost(host)) return host;
  } catch { /* Missing Metro host: keep the explicitly configured address. */ }
  return configured;
}

export function resolveLocalServiceUrl(endpoint: string | undefined, configured: string, host: string, enabled: boolean) {
  if (!endpoint || !enabled) return endpoint;
  try {
    const url = new URL(endpoint);
    if (url.protocol === 'http:' && isLocalHost(url.hostname) &&
        (url.hostname === configured || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) {
      url.hostname = host;
      return url.toString();
    }
  } catch { /* The classifier reports invalid endpoint configuration. */ }
  return endpoint;
}
