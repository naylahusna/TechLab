import { existsSync } from 'node:fs';
import { emitKeypressEvents } from 'node:readline';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { deleteApp, initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  getFirestore,
  orderBy,
  query,
  terminate,
  where,
} from 'firebase/firestore';

// Match Expo's file precedence without printing any config or account secrets.
const root = new URL('../', import.meta.url);
for (const name of ['.env.local', '.env']) {
  const file = new URL(name, root);
  if (existsSync(file)) process.loadEnvFile(file);
}

const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;
if (!apiKey || !appId || projectId !== 'techlab-naylahusna-2026') {
  throw new Error('Isi .env atau .env.local dengan konfigurasi Firebase TechLab; .env.example tidak dimuat otomatis.');
}
if (process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
  throw new Error('Pemeriksaan ini untuk cloud. Gunakan EXPO_PUBLIC_USE_FIREBASE_EMULATORS=false.');
}
if (!stdin.isTTY) {
  throw new Error('Jalankan npm run firebase:check di terminal interaktif untuk memasukkan akun sendiri.');
}

async function readPassword() {
  stdout.write('Password (disembunyikan): ');
  emitKeypressEvents(stdin);
  const wasRaw = stdin.isRaw;
  stdin.setRawMode(true);
  stdin.resume();
  return new Promise((resolve) => {
    let value = '';
    function finish(cancelled = false) {
      stdin.off('keypress', onKey);
      stdin.setRawMode(wasRaw);
      stdin.pause();
      stdout.write('\n');
      resolve(cancelled ? null : value);
    }
    function onKey(text, key = {}) {
      if (key.ctrl && key.name === 'c') return finish(true);
      if (key.name === 'return' || key.name === 'enter') return finish();
      if (key.name === 'backspace') value = value.slice(0, -1);
      else if (text && !key.ctrl && !key.meta && !text.includes('\u001b')) value += text;
    }
    stdin.on('keypress', onKey);
  });
}

console.log(`Memeriksa Firebase cloud: ${projectId}`);
console.log('Pemeriksaan hanya membaca data; password tidak disimpan.');
const prompt = createInterface({ input: stdin, output: stdout });
const email = (await prompt.question('Email akun aplikasi: ')).trim();
prompt.close();
const password = await readPassword();
if (password === null) {
  console.log('Pemeriksaan dibatalkan.');
  process.exit(0);
}
const app = initializeApp({ apiKey, projectId, appId }, 'techlab-cloud-check');
const auth = getAuth(app);
const db = getFirestore(app);
let step = 'Login Firebase Authentication';

try {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  console.log('OK: login Firebase Authentication.');
  step = 'Membaca users/{uid}';
  const profile = await getDocFromServer(doc(db, 'users', user.uid));
  if (!profile.exists()) throw new Error('Profil Firestore belum ada untuk akun ini. Lengkapi profil melalui aplikasi.');
  const role = profile.data().role;
  if (!['praktikan', 'asisten'].includes(role)) throw new Error('Peran pada profil tidak valid.');
  console.log(`OK: profil ${role}.`);
  step = 'Query classes dengan memberIds berisi UID akun aktif';
  const classes = await getDocsFromServer(query(collection(db, 'classes'), where('memberIds', 'array-contains', user.uid)));
  console.log(`OK: akses kelas; ${classes.size} kelas terkait.`);
  if (classes.empty) console.log('Belum terdaftar di kelas. Ini kondisi kosong, bukan error permission-denied.');
  for (const item of classes.docs) {
    const classData = item.data();
    const members = role === 'asisten' ? classData.assistantIds : classData.studentIds;
    if (!Array.isArray(members) || !members.includes(user.uid)) {
      throw new Error(`Keanggotaan kelas ${item.id} tidak konsisten antara memberIds dan ${role === 'asisten' ? 'assistantIds' : 'studentIds'}.`);
    }
    for (const name of ['schedules', 'sessions']) {
      step = `Query ${name} untuk kelas ${item.id}`;
      const snapshot = await getDocsFromServer(query(collection(db, name), where('classId', '==', item.id), orderBy('startAt', 'asc')));
      console.log(`OK: ${name} kelas ${item.id}; ${snapshot.size} dokumen.`);
    }
  }
  console.log('Selesai: query utama halaman Jadwal diizinkan oleh Firestore cloud.');
} catch (error) {
  console.error(`GAGAL pada: ${step}`);
  console.error(`Kode: ${error.code ?? 'invalid-data'}`);
  if (error.code === 'permission-denied') {
    console.error('Periksa rules yang benar-benar terpasang di Firebase Console. File firestore.rules di GitHub tidak otomatis terdeploy.');
    console.error('Pemilik proyek dapat menjalankan npm run firebase:login, lalu npm run firebase:deploy. Jangan membuka akses dengan allow read, write: if true.');
  } else if (error.code === 'failed-precondition') {
    console.error('Periksa/deploy firestore.indexes.json dan tunggu index selesai dibuat.');
  } else if (error.code?.startsWith('auth/')) {
    console.error('Login gagal. Pastikan akun terdaftar di Firebase cloud, bukan hanya Auth Emulator, dan Email/Password aktif.');
  } else {
    console.error(error.message);
  }
  process.exitCode = 1;
} finally {
  await signOut(auth);
  await terminate(db);
  await deleteApp(app);
}
