import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, renameSync } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';

function exportFile(root, name) {
  if (typeof name !== 'string' || !name || isAbsolute(name)) return null;
  const path = resolve(root, name);
  const child = relative(root, path);
  if (!child || child.startsWith('..') || isAbsolute(child)) return null;
  return path;
}

function completeExport(root) {
  try {
    const metadata = JSON.parse(readFileSync(join(root, 'firebase-export-metadata.json'), 'utf8'));
    const auth = exportFile(root, metadata.auth?.path);
    const firestore = exportFile(root, metadata.firestore?.metadata_file);
    if (!auth || !firestore) return false;
    const accounts = JSON.parse(readFileSync(join(auth, 'accounts.json'), 'utf8'));
    const config = JSON.parse(readFileSync(join(auth, 'config.json'), 'utf8'));
    return (
      Array.isArray(accounts.users) &&
      config !== null &&
      typeof config === 'object' &&
      lstatSync(firestore).isFile() &&
      lstatSync(firestore).size > 0
    );
  } catch {
    return false;
  }
}

// An interrupted Firebase CLI export can leave a complete firebase-export-* directory
// beside the project instead of moving it into .firebase/emulators. Never replace
// a valid export, and preserve both the recovered source and any incomplete target.
export function prepareEmulatorExport(projectRoot) {
  const root = resolve(projectRoot);
  const firebase = join(root, '.firebase');
  const target = join(firebase, 'emulators');
  mkdirSync(firebase, { recursive: true });
  if (completeExport(target)) return null;

  const candidates = readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^firebase-export-\d+[a-zA-Z0-9]+$/.test(entry.name))
    .map((entry) => ({ name: entry.name, path: join(root, entry.name) }))
    .filter((entry) => completeExport(entry.path))
    .sort((a, b) => lstatSync(b.path).mtimeMs - lstatSync(a.path).mtimeMs);
  const source = candidates[0];
  if (!source) return null;

  // Do not follow a replacement symlink or delete existing local data.
  if (existsSync(target)) {
    if (!lstatSync(target).isDirectory() || lstatSync(target).isSymbolicLink()) {
      throw new Error('Lokasi .firebase/emulators harus berupa folder lokal.');
    }
    let backup = join(firebase, `emulators-before-recovery-${Date.now()}`);
    while (existsSync(backup)) backup += '-backup';
    renameSync(target, backup);
  }
  cpSync(source.path, target, { recursive: true, errorOnExist: true, force: false });
  return source.name;
}
