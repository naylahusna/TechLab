// Local UI smoke test only: two isolated Chrome contexts, Firebase demo accounts.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, updateDoc } from 'firebase/firestore';

const base = process.env.TECHLAB_SMOKE_URL ?? 'http://localhost:8083';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname))
  throw new Error('Local demo servers only.');
const dir = resolve('.tmp/permission-ui');
mkdirSync(dir, { recursive: true });
const chrome = spawn(
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  [
    '--headless',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=9226',
    `--user-data-dir=${resolve(dir, 'profile')}`,
    'about:blank',
  ],
  { windowsHide: true, stdio: 'ignore' },
);
let ws;
let seq = 0;
const pending = new Map();
const pages = [];
const browserErrors = [];
let roleEnv;
let studentUid;
async function grantRoles(roles) {
  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST;
  for (const host of [authHost, firestoreHost]) {
    if (!host || !/^(127\.0\.0\.1|localhost):\d+$/.test(host))
      throw new Error('Role smoke tests require explicit local Firebase emulator hosts.');
  }
  if (!studentUid) {
    const response = await fetch(
      `http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'praktikan2.demo@techlab.test',
          password: 'TechLab123!',
          returnSecureToken: true,
        }),
      },
    );
    if (!response.ok) throw new Error('Cannot authenticate the local demo student.');
    studentUid = (await response.json()).localId;
    const [host, port] = firestoreHost.split(':');
    roleEnv = await initializeTestEnvironment({
      projectId: 'techlab-naylahusna-2026',
      firestore: { host, port: Number(port) },
    });
  }
  await roleEnv.withSecurityRulesDisabled((context) =>
    updateDoc(doc(context.firestore(), 'users', studentUid), { roles }),
  );
}
const delay = (ms) => new Promise((done) => setTimeout(done, ms));
async function until(check, label, timeout = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await check()) return;
    await delay(200);
  }
  throw new Error(`Timeout: ${label}`);
}
async function send(method, params = {}, sessionId) {
  return new Promise((resolveCall, rejectCall) => {
    const id = ++seq;
    const timer = setTimeout(() => {
      pending.delete(id);
      rejectCall(new Error(`CDP timeout: ${method}`));
    }, 30000);
    pending.set(id, {
      resolve: (value) => {
        clearTimeout(timer);
        resolveCall(value);
      },
      reject: (error) => {
        clearTimeout(timer);
        rejectCall(error);
      },
    });
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
}
async function page() {
  const { browserContextId } = await send('Target.createBrowserContext');
  const { targetId } = await send('Target.createTarget', { url: 'about:blank', browserContextId });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const command = (method, params) => send(method, params, sessionId);
  await command('Page.enable');
  await command('Runtime.enable');
  await command('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  const evaluate = async (expression) => {
    const result = await command('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails)
      throw new Error(
        result.exceptionDetails.text + ': ' + result.exceptionDetails.exception?.description,
      );
    return result.result.value;
  };
  const body = () => evaluate('document.body.innerText');
  const navigate = async (path) => {
    await command('Page.navigate', { url: base + path });
  };
  const waitText = (text, timeout = 60000) =>
    until(async () => (await body()).includes(text), text, timeout);
  const click = async (label) => {
    await until(
      () =>
        evaluate(
          `(() => {const e=[...document.querySelectorAll('button,[role="button"]')].find(e=>e.textContent.trim()===${JSON.stringify(label)});return !!e && !e.disabled && e.getAttribute('aria-disabled')!=='true';})()`,
        ),
      `Enabled button ${label}`,
    );
    const ok = await evaluate(
      `(() => {const e=[...document.querySelectorAll('button,[role="button"]')].find(e=>e.textContent.trim()===${JSON.stringify(label)}); if (!e) return false; e.click();return true;})()`,
    );
    assert.ok(ok, `Button ${label} exists`);
  };
  const input = async (label, value) => {
    await until(
      () =>
        evaluate(
          `(() => {const e=document.querySelector('[aria-label='+${JSON.stringify(JSON.stringify(label))}+']'); if(!e || e.disabled)return false; e.focus(); return true;})()`,
        ),
      `Input ${label} is ready`,
    );
    await command('Input.insertText', { text: value });
  };
  const screenshot = async (name) => {
    const { data } = await command('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });
    writeFileSync(resolve(dir, name + '.png'), Buffer.from(data, 'base64'));
  };
  const tab = async (name) => {
    const found = await evaluate(`(() => {
      const el = document.querySelector('[data-testid="tab-${name}"]');
      if (!el) return false; el.click(); return true;
    })()`);
    assert.ok(found, `Tab ${name} exists`);
  };
  const result = { command, evaluate, body, navigate, waitText, click, input, screenshot, tab };
  pages.push(result);
  return result;
}
try {
  await until(
    async () => {
      try {
        return (await fetch(base)).ok;
      } catch {
        return false;
      }
    },
    'local Metro HTTP server',
    120000,
  );
  let version;
  await until(
    async () => {
      try {
        const r = await fetch('http://127.0.0.1:9226/json/version');
        version = await r.json();
        return true;
      } catch {
        return false;
      }
    },
    'Chrome startup',
    15000,
  );
  ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((done) => ws.addEventListener('open', done, { once: true }));
  ws.addEventListener('message', ({ data }) => {
    const message = JSON.parse(String(data));
    if (message.method === 'Runtime.exceptionThrown')
      browserErrors.push(
        message.params.exceptionDetails.exception?.description ??
          message.params.exceptionDetails.text,
      );
    if (!message.id) return;
    const call = pending.get(message.id);
    if (!call) return;
    pending.delete(message.id);
    if (message.error) call.reject(new Error(message.error.message));
    else call.resolve(message.result);
  });
  const student = await page();
  const assistant = await page();
  await student.navigate('/');
  await student.waitText('Selamat datang kembali.', 180000);
  await student.screenshot('01-login-desktop');
  await student.input('Email', 'praktikan2.demo@techlab.test');
  await student.input('Password', 'TechLab123!');
  await student.click('Masuk');
  await student.waitText('Jadwal Praktikum');
  console.log('PASS student login');
  await assistant.navigate('/');
  await assistant.waitText('Selamat datang kembali.');
  await assistant.input('Email', 'asisten.demo@techlab.test');
  await assistant.input('Password', 'TechLab123!');
  await assistant.click('Masuk');
  await assistant.waitText('Sesi Praktikum');
  console.log('PASS assistant login');
  await student.navigate('/izin/new?sessionId=schedule-b-1');
  await student.waitText('CERITAKAN ALASANMU');
  const reason = 'Saya sedang sakit dan perlu beristirahat untuk pemulihan.';
  await student.input('Alasan izin', reason);
  await student.click('Periksa & kirim pengajuan');
  await student.waitText('Kirim pengajuan ini?');
  await student.click('Batal');
  await until(
    async () => !(await student.body()).includes('Kirim pengajuan ini?'),
    'confirmation dismissed',
  );
  console.log('PASS submission cancellation');
  await student.click('Periksa & kirim pengajuan');
  await student.waitText('Kirim pengajuan ini?');
  await student.click('Ya, kirim pengajuan');
  await student.waitText('PENGAJUAN TERKIRIM');
  assert.ok((await student.body()).includes('Menunggu'));
  console.log('PASS persisted submission');
  await assistant.navigate('/izin');
  await assistant.waitText('PENGAJUAN DARI KELASMU');
  await assistant.waitText('Pertemuan 4');
  // Find the newly submitted Basis Data session rather than seeded requests.
  const card = await assistant.evaluate(
    `(() => { const e=[...document.querySelectorAll('[role="button"]')].find(e=>(e.getAttribute('aria-label')||'').includes('Detail izin Praktikan Demo 2 Pertemuan 4')); if(!e)return false;e.click();return true;})()`,
  );
  assert.ok(card, 'Assistant can find new request');
  await assistant.waitText('KEPUTUSAN ASISTEN');
  await assistant.input('Catatan keputusan asisten', 'Silakan istirahat dan semoga lekas pulih.');
  await assistant.click('Setujui pengajuan');
  await assistant.waitText('Setujui izin ini?');
  assert.ok((await student.body()).includes('Menunggu'));
  await assistant.click('Konfirmasi keputusan');
  await student.waitText('Disetujui');
  await assistant.waitText('Disetujui');
  assert.ok((await student.body()).includes('Silakan istirahat dan semoga lekas pulih.'));
  await assistant.screenshot('02-asisten-keputusan');
  console.log('PASS real-time cross-account decision');
  await student.command('Page.reload');
  await student.waitText('Disetujui');
  console.log('PASS status survives full reload');
  await student.command('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await student.screenshot('03-praktikan-status-mobile');
  await student.navigate('/izin');
  await student.waitText('PENGAJUAN SAYA');
  await student.waitText(reason);
  await student.screenshot('04-izin-mobile');
  await student.click('Ditolak');
  await student.waitText('Mengikuti kegiatan organisasi kampus.');
  assert.ok(!(await student.body()).includes(reason));
  console.log('PASS status filter');
  const newcomer = await page();
  const newNumber = `IT-${Date.now()}`;
  await newcomer.navigate('/register');
  await newcomer.waitText('Mulai perjalananmu.');
  await newcomer.input('Nama lengkap', 'Mahasiswa Integrasi');
  await newcomer.input('NIM / ID', newNumber);
  await newcomer.input('Email', `integrasi-${Date.now()}@techlab.test`);
  await newcomer.input('Password', 'TechLab123!');
  await newcomer.input('Konfirmasi password', 'TechLab123!');
  await newcomer.click('Daftar');
  await newcomer.waitText('Jadwal Praktikum');
  await assistant.navigate('/kelas/class-if-a/peserta');
  await assistant.waitText('Kelola Peserta');
  await assistant.input('Cari NIM atau nama', newNumber);
  await assistant.click('Cari Pengguna');
  await assistant.waitText('Mahasiswa Integrasi');
  await assistant.click('Tambah');
  await until(
    () =>
      assistant.evaluate(`(() => {
    const heading = [...document.querySelectorAll('*')].find(el =>
      el.childElementCount === 0 && el.textContent === 'Peserta Terdaftar');
    return !!heading?.parentElement?.textContent.includes(${JSON.stringify(newNumber)});
  })()`),
    'new participant is listed after saving',
  );
  await newcomer.command('Page.reload');
  await newcomer.waitText('Jadwal Praktikum');
  console.log('PASS registration, automatic directory sync, participant lookup, and class read');
  await grantRoles(['praktikan', 'asisten']);
  await student.command('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await student.navigate('/profil');
  await student.waitText('Mode Praktikan');
  await student.waitText('Gunakan mode Asprak');
  await student.click('Gunakan mode Asprak');
  await student.waitText('Gunakan mode Asprak?');
  await student.click('Batal');
  await until(
    async () => !(await student.body()).includes('Gunakan mode Asprak?'),
    'role cancellation',
  );
  assert.ok((await student.body()).includes('Mode Praktikan'));
  console.log('PASS role switch cancellation');
  await student.click('Gunakan mode Asprak');
  await student.click('Ganti mode');
  await student.waitText('Mode Asprak');
  await student.screenshot('05-profile-asprak-desktop');
  await student.tab('izin');
  await student.waitText('PENGAJUAN DARI KELASMU');
  assert.ok(
    !(await student.body()).includes(reason),
    'Assistant mode does not list own student permission',
  );
  await student.tab('profil');
  await student.waitText('Mode Asprak');
  await student.click('Gunakan mode Praktikan');
  await student.click('Ganti mode');
  await student.waitText('Mode Praktikan');
  await student.tab('izin');
  await student.waitText('PENGAJUAN SAYA');
  await student.waitText(reason);
  console.log('PASS same-account mode switch, permission scoping, and preserved history');
  await student.tab('profil');
  await student.click('Gunakan mode Asprak');
  await student.click('Ganti mode');
  await student.waitText('Mode Asprak');
  await grantRoles(['praktikan']);
  await student.waitText('Mode Praktikan');
  assert.ok(!(await student.body()).includes('Gunakan mode Asprak'));
  console.log('PASS live role revocation');
  await student.command('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await student.screenshot('06-profile-revoked-mobile');
  await student.click('Keluar dari akun');
  await student.waitText('Keluar dari TechLab?');
  await student.click('Keluar');
  await student.waitText('Selamat datang kembali.');
  await student.navigate('/izin');
  await student.waitText('Selamat datang kembali.');
  assert.ok(!(await student.body()).includes(reason));
  console.log('PASS logout and protected direct route after logout');
  assert.deepEqual(browserErrors, [], 'No uncaught browser exceptions during integration');
  console.log(
    'PASS UI smoke: login, submit/cancel, assistant decision, live status, reload, filters, mobile.',
  );
} catch (error) {
  for (let i = 0; i < pages.length; i++) {
    try {
      console.error(`PAGE ${i}:`, (await pages[i].body()).slice(0, 7000));
      await pages[i].screenshot(`failure-${i}`);
    } catch {}
  }
  throw error;
} finally {
  if (ws?.readyState === WebSocket.OPEN) {
    try {
      await send('Browser.close');
    } catch {}
    ws.close();
  }
  chrome.kill();
  await roleEnv?.cleanup();
}
