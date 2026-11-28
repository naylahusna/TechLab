import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

function entries(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} harus berupa objek.`);
  const pairs = Object.entries(value);
  if (pairs.some(([id]) => !id || id.includes('/') || id === '.' || id === '..')) throw new Error(`ID ${label} tidak valid.`);
  return pairs;
}

export async function backfillAslabScopes(db, plan, { apply = false } = {}) {
  const scopes = entries(plan.aslabScopes, 'aslabScopes');
  const labs = entries(plan.labCourses, 'labCourses');
  if (scopes.length + labs.length > 450) throw new Error('Pisahkan batch menjadi maksimal 450 dokumen.');
  const validCourse = (course) => typeof course === 'string' && course === course.trim() && course.length > 0 && course.length <= 100;

  return db.runTransaction(async (transaction) => {
    const updates = [];
    for (const [uid, courseNames] of scopes) {
      if (!Array.isArray(courseNames) || courseNames.length === 0 || courseNames.length > 30
        || new Set(courseNames).size !== courseNames.length || !courseNames.every(validCourse)) {
        throw new Error(`Cakupan mata kuliah tidak valid untuk ${uid}.`);
      }
      const profile = await transaction.get(db.doc(`users/${uid}`));
      if (profile.data()?.role !== 'admin' || profile.data()?.uid !== uid) throw new Error(`Profil Aslab tidak cocok untuk ${uid}.`);
      const ref = db.doc(`aslabScopes/${uid}`);
      const current = (await transaction.get(ref)).data()?.courseNames;
      if (current !== undefined) {
        if (Array.isArray(current) && current.length === courseNames.length && courseNames.every((course) => current.includes(course))) continue;
        throw new Error(`Cakupan ${uid} sudah ada dan berbeda dari rencana.`);
      }
      updates.push({ ref, data: { courseNames }, create: true });
    }
    for (const [id, courseName] of labs) {
      if (!validCourse(courseName)) throw new Error(`Mata kuliah tidak valid untuk lab ${id}.`);
      const ref = db.doc(`labLocations/${id}`);
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) throw new Error(`Lokasi lab ${id} tidak ditemukan.`);
      const current = snapshot.data().courseName;
      if (current === courseName) continue;
      if (current != null) throw new Error(`Mata kuliah lab ${id} sudah ada dan berbeda dari rencana.`);
      updates.push({ ref, data: { courseName }, create: false });
    }
    if (apply) {
      for (const { ref, data, create } of updates) {
        if (create) transaction.create(ref, data);
        else transaction.update(ref, data);
      }
    }
    return { applied: apply, paths: updates.map(({ ref }) => ref.path) };
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [projectId, filename, mode] = process.argv.slice(2);
  if (!projectId || !filename || (mode !== undefined && mode !== '--apply')) {
    throw new Error('Penggunaan: node server/aslab-scope-backfill.mjs <firebase-project-id> <plan.json> [--apply]');
  }
  const plan = JSON.parse(await readFile(filename, 'utf8'));
  const { initializeApp } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');
  const app = initializeApp({ projectId });
  console.log(JSON.stringify(await backfillAslabScopes(getFirestore(app), plan, { apply: mode === '--apply' }), null, 2));
}
