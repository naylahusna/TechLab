import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';

const require = createRequire(import.meta.url);
const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const testFiles = readdirSync(new URL('../tests/', import.meta.url))
  .filter((name) => name.endsWith('.test.ts'))
  .sort()
  .map((name) =>
    fileURLToPath(new URL(`../dist/tests/tests/${name.slice(0, -3)}.js`, import.meta.url)),
  );

if (testFiles.length === 0) throw new Error('No source test files found.');

function run(args) {
  const result = spawnSync(process.execPath, args, { cwd: projectRoot, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run([require.resolve('typescript/bin/tsc'), '-p', 'tsconfig.test.json']);
// Run only current source tests, even when dist contains artifacts from another branch.
run(['--test', ...testFiles]);
