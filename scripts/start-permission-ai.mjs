import { existsSync } from 'node:fs';
import process from 'node:process';
import { createPermissionAiServer } from '../server/permission-ai.mjs';

for (const file of ['.env.ai.local', '.env.local', '.env']) {
  if (existsSync(file)) process.loadEnvFile(file);
}
const server = createPermissionAiServer({
  baseUrl: process.env.PERMISSION_AI_BASE_URL,
  apiKey: process.env.PERMISSION_AI_API_KEY,
  model: process.env.PERMISSION_AI_MODEL,
  firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  useEmulators: process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS === 'true',
  allowedOrigins: (process.env.PERMISSION_AI_ALLOWED_ORIGINS ?? '').split(',').filter(Boolean),
});
const host = process.env.PERMISSION_AI_HOST || '127.0.0.1';
const port = Number(process.env.PERMISSION_AI_PORT || 8787);
server.listen(port, host, () => {
  console.log(`Perantara AI TechLab siap di http://${host}:${port}/permission/classify`);
  console.log('API key hanya digunakan di server. Tidak ada log alasan atau identitas pengguna.');
});
server.on('error', () => { console.error('Server AI gagal berjalan. Periksa konfigurasi dan port.'); process.exitCode = 1; });
