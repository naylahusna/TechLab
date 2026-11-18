import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { prepareEmulatorExport } from '../scripts/emulator-export.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'techlab-export-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function snapshot(root, name, email) {
  const path = join(root, name);
  mkdirSync(join(path, 'auth_export'), { recursive: true });
  mkdirSync(join(path, 'firestore_export'), { recursive: true });
  writeFileSync(join(path, 'firebase-export-metadata.json'), JSON.stringify({
    auth: { path: 'auth_export' },
    firestore: { metadata_file: 'firestore_export/firestore_export.overall_export_metadata' },
  }));
  writeFileSync(join(path, 'auth_export/accounts.json'), JSON.stringify({ users: [{ email }] }));
  writeFileSync(join(path, 'auth_export/config.json'), '{}');
  writeFileSync(join(path, 'firestore_export/firestore_export.overall_export_metadata'), 'fixture');
  return path;
}

test('recovers a complete interrupted export without losing the source or partial target', (t) => {
  const root = fixture(t);
  const source = snapshot(root, 'firebase-export-123ABC', 'demo@techlab.test');
  const partial = join(root, '.firebase/emulators');
  mkdirSync(partial, { recursive: true });
  writeFileSync(join(partial, 'keep.txt'), 'previous local data');
  assert.equal(prepareEmulatorExport(root), 'firebase-export-123ABC');
  assert.equal(readFileSync(join(partial, 'auth_export/accounts.json'), 'utf8'),
    readFileSync(join(source, 'auth_export/accounts.json'), 'utf8'));
  assert.ok(existsSync(join(source, 'auth_export/accounts.json')));
  assert.equal(prepareEmulatorExport(root), null);
});

test('never replaces a valid existing export, including an intentionally empty account list', (t) => {
  const root = fixture(t);
  const target = snapshot(root, '.firebase/emulators', 'current@techlab.test');
  writeFileSync(join(target, 'auth_export/accounts.json'), '{"users":[]}');
  snapshot(root, 'firebase-export-456DEF', 'old@techlab.test');
  assert.equal(prepareEmulatorExport(root), null);
  assert.equal(readFileSync(join(target, 'auth_export/accounts.json'), 'utf8'), '{"users":[]}');
});

test('ignores incomplete exports and rejects metadata paths outside their snapshot', (t) => {
  const root = fixture(t);
  snapshot(root, 'firebase-export-789GHI', 'demo@techlab.test');
  writeFileSync(join(root, 'firebase-export-789GHI/firebase-export-metadata.json'), JSON.stringify({
    auth: { path: '../auth_export' },
    firestore: { metadata_file: '../outside' },
  }));
  mkdirSync(join(root, 'firebase-export-999JKL'), { recursive: true });
  assert.equal(prepareEmulatorExport(root), null);
  assert.equal(existsSync(join(root, '.firebase/emulators')), false);
});
