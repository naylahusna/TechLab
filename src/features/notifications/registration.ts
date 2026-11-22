export type PushState = 'loading' | 'ready' | 'denied' | 'unsupported' | 'error';
type Permission = { granted: boolean; canAskAgain: boolean };
type Services = {
  supported: boolean;
  prepare(): Promise<void>;
  permission(): Promise<Permission>;
  request(): Promise<Permission>;
  token(): Promise<string>;
  save(token: string): Promise<void>;
  revoke(): Promise<void>;
  active(): boolean;
};
export async function registerPush(services: Services, timeoutMs = 15000): Promise<PushState> {
  let expired = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      registerAttempt({ ...services, active: () => !expired && services.active() }),
      new Promise<PushState>((resolve) => {
        timer = setTimeout(() => { expired = true; resolve('error'); }, timeoutMs);
      }),
    ]);
  } finally { if (timer) clearTimeout(timer); }
}
async function registerAttempt(services: Services): Promise<PushState> {
  if (!services.supported) return 'unsupported';
  try {
    await services.prepare();
    let permission = await services.permission();
    if (!permission.granted && permission.canAskAgain) permission = await services.request();
    if (!permission.granted) {
      await services.revoke();
      return 'denied';
    }
    const token = await services.token();
    if (!/^(Expo|Exponent)PushToken\[[^\]]+\]$/.test(token)) return 'error';
    if (!services.active()) return 'error';
    await services.save(token);
    return 'ready';
  } catch {
    return 'error';
  }
}
