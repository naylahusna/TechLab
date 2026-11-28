import assert from 'node:assert/strict';
import test from 'node:test';
import { backfillAslabScopes } from './aslab-scope-backfill.mjs';

function setup() {
  const data = new Map([
    ['users/aslab-a', { uid: 'aslab-a', role: 'admin' }],
    ['labLocations/lab-b', { name: 'Lab B', radiusMeters: 100 }],
  ]);
  const db = {
    doc: (path) => ({ path }),
    runTransaction: (readAndWrite) => readAndWrite({
      get: async ({ path }) => ({ exists: data.has(path), data: () => data.get(path) }),
      create: ({ path }, value) => data.set(path, value),
      update: ({ path }, value) => data.set(path, { ...data.get(path), ...value }),
    }),
  };
  return { db, data };
}

const plan = { aslabScopes: { 'aslab-a': ['Basis Data'] }, labCourses: { 'lab-b': 'Basis Data' } };

test('backfill previews without writing, preserves legacy data, and repeats safely', async () => {
  const { db, data } = setup();
  assert.deepEqual(await backfillAslabScopes(db, plan), {
    applied: false, paths: ['aslabScopes/aslab-a', 'labLocations/lab-b'],
  });
  assert.equal(data.size, 2);
  await backfillAslabScopes(db, plan, { apply: true });
  assert.deepEqual(data.get('labLocations/lab-b'), {
    name: 'Lab B', radiusMeters: 100, courseName: 'Basis Data',
  });
  assert.deepEqual(data.get('users/aslab-a'), { uid: 'aslab-a', role: 'admin' });
  assert.deepEqual((await backfillAslabScopes(db, plan, { apply: true })).paths, []);
});

test('invalid or conflicting entries leave data unchanged', async () => {
  const { db, data } = setup();
  await assert.rejects(backfillAslabScopes(db, { ...plan, labCourses: { 'missing-lab': 'Basis Data' } }, { apply: true }), /tidak ditemukan/);
  assert.equal(data.size, 2);
  await backfillAslabScopes(db, plan, { apply: true });
  await assert.rejects(backfillAslabScopes(db, { ...plan, aslabScopes: { 'aslab-a': ['Jaringan'] } }, { apply: true }), /berbeda/);
  assert.deepEqual(data.get('aslabScopes/aslab-a'), { courseNames: ['Basis Data'] });
});
