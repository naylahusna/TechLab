import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  courseLabKey, labHasName, resolveCourseLabs, selectLabForCourse, validateGraceMinutes, validateLabLocation,
} from '../src/features/assistant/lab-location-policy';

const input = {
  name: ' Lab   B ', building: ' Gedung E ', latitude: -7, longitude: 110,
  radiusMeters: 100, floor: null, plusCode: '',
};

test('normalizes physical fields and validates a separate course tolerance', () => {
  const clean = validateLabLocation(input);
  assert.equal(clean.name, 'Lab B');
  assert.equal(clean.building, 'Gedung E');
  assert.equal(validateGraceMinutes(0), 0);
  assert.equal(validateGraceMinutes(15), 15);
  assert.equal(courseLabKey('Praktikum/PPK%'), 'course-Praktikum%2FPPK%25');
});

test('rejects invalid physical coordinates, radius and course grace', () => {
  for (const invalid of [
    { latitude: NaN }, { latitude: 91 }, { longitude: -181 }, { radiusMeters: 0 }, { radiusMeters: Infinity },
  ]) assert.throws(() => validateLabLocation({ ...input, ...invalid }));
  for (const invalid of [-1, 1.5, NaN]) assert.throws(() => validateGraceMinutes(invalid));
});

test('one physical lab can serve two courses and old names still resolve', () => {
  const other = { id: 'other', name: 'Lab B', legacyCourseName: 'Jaringan', archivedAt: null };
  const renamed = { id: 'shared', name: 'Lab C', previousNames: ['Lab B'], legacyCourseName: 'Basis Data', archivedAt: null };
  const legacy = { id: 'old', name: 'Lab Lama', archivedAt: null };
  const unlinked = { id: 'unlinked', name: 'Lab D', catalogVersion: 2, archivedAt: null };
  const labs = [other, renamed, legacy, unlinked];
  assert.equal(labHasName(renamed, ' LAB   B '), true);
  assert.equal(selectLabForCourse(labs, 'Basis Data', 'Lab B'), renamed);
  assert.equal(selectLabForCourse(labs, 'PPK', 'Lab B'), undefined);
  assert.equal(selectLabForCourse(labs, 'PPK', 'Lab B', 'shared'), renamed);
  assert.equal(selectLabForCourse(labs, 'PPK', 'Lab Lama'), legacy);
  assert.deepEqual(resolveCourseLabs(labs, 'Basis Data', ['shared']), [renamed]);
  assert.deepEqual(resolveCourseLabs(labs, 'PPK', ['shared']), [renamed]);
  assert.deepEqual(resolveCourseLabs(labs, 'PPK', []), []);
  assert.deepEqual(resolveCourseLabs(labs, 'Basis Data'), [renamed, legacy]);
});
