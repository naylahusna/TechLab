import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import process from 'node:process';

if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  throw new Error('Both Firebase emulators are required. Production tests are prohibited.');
}
const require = createRequire(import.meta.url);
for (const args of [
  [require.resolve('typescript/bin/tsc'), '-p', 'tsconfig.test.json'],
  [
    '--test',
    '--test-concurrency=1',
    'tests/firestore.rules.test.mjs',
    'tests/practicum.rules.test.mjs',
    'tests/practicum.integration.mjs',
    'tests/firebase-auth.integration.mjs',
  ],
]) {
  const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
