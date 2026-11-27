import assert from 'node:assert/strict';
import { test } from 'node:test';
import { labHasName, selectLabForCourse, validateLabLocation } from '../src/features/assistant/lab-location-policy';

const input = {
  courseName: ' Basis Data ', name: ' Lab   B ', building: ' Gedung E ',
  latitude: -7, longitude: 110, radiusMeters: 100, graceMinutes: 0,
  floor: null, plusCode: '',
};

test('normalizes lab fields and accepts zero grace minutes', () => {
  const clean = validateLabLocation(input);
  assert.equal(clean.name, 'Lab B');
  assert.equal(clean.courseName, 'Basis Data');
  assert.equal(clean.building, 'Gedung E');
  assert.equal(clean.graceMinutes, 0);
});

test('rejects invalid coordinates, radius and grace minutes', () => {
  for (const invalid of [
    { latitude: NaN }, { latitude: 91 }, { longitude: -181 }, { radiusMeters: 0 },
    { radiusMeters: Infinity }, { radiusMeters: 5001 }, { graceMinutes: -1 },
    { graceMinutes: 1.5 }, { graceMinutes: NaN },
  ]) assert.throws(() => validateLabLocation({ ...input, ...invalid }));
});

test('resolves prior names within the course and preserves unscoped legacy locations', () => {
  const other = { name: 'Lab B', courseName: 'Jaringan' };
  const renamed = { name: 'Lab C', previousNames: ['Lab B'], courseName: 'Basis Data' };
  const legacy = { name: 'Lab Lama', courseName: '' };
  assert.equal(labHasName(renamed, ' LAB   B '), true);
  assert.equal(selectLabForCourse([other, renamed, legacy], 'Basis Data', 'Lab B'), renamed);
  assert.equal(selectLabForCourse([other, renamed, legacy], 'PPK', 'Lab B'), undefined);
  assert.equal(selectLabForCourse([other, renamed, legacy], 'PPK', 'Lab Lama'), legacy);
});
