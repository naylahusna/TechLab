import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseImportCsv, previewCsvRows } from '../src/features/imports/csv';
import { labCsvHeaders, parseLabRow } from '../src/features/assistant/lab-csv';
import { parsePractitionerRow, practitionerCsvHeaders } from '../src/features/practicum/practitioner-csv';
import { normalizeLabName } from '../src/features/assistant/lab-location-policy';

const header = labCsvHeaders.join(',');
const row = 'Lab B,"Gedung E, FSM",2,-7,110,100,';

test('CSV preview repairs incomplete rows and keeps skipped rows out of the duplicate check', () => {
  const rows = parseImportCsv('\uFEFF' + header + '\r\n' + row + '\r\nLab C,E,,,-110,100,\r\n' + row, labCsvHeaders);
  const preview = () => previewCsvRows(rows, parseLabRow, (lab) => normalizeLabName(lab.name));
  assert.deepEqual(rows.map((item) => item.line), [2, 3, 4]);
  assert.equal(preview()[0].value?.building, 'Gedung E, FSM');
  assert.match(preview()[1].error ?? '', /latitude/);
  assert.match(preview()[2].error ?? '', /Duplikat/);
  rows[0].selected = false;
  rows[1].values.latitude = '-7,1';
  assert.equal(preview()[1].value?.latitude, -7.1);
  assert.equal(preview()[2].error, undefined);
});

test('Praktikan has its own CSV header and retains leading zeros in NIM', () => {
  const rows = parseImportCsv('nim_praktikan\n001234\n001234', practitionerCsvHeaders);
  const preview = previewCsvRows(rows, parsePractitionerRow, (number) => number);
  assert.equal(preview[0].value, '001234');
  assert.match(preview[1].error ?? '', /Duplikat/);
  assert.throws(() => parseImportCsv(header + '\n' + row, practitionerCsvHeaders), /Header/);
});

test('CSV rejects an empty file, wrong or duplicate headers and malformed quoted data', () => {
  assert.throws(() => parseImportCsv('', labCsvHeaders), /kosong/);
  assert.throws(() => parseImportCsv(header, labCsvHeaders), /belum berisi/);
  assert.throws(() => parseImportCsv('name,name\nB,B', labCsvHeaders), /Header/);
  assert.throws(() => parseImportCsv(header + '\n"Lab B', labCsvHeaders), /belum ditutup/);
  assert.throws(() => parseLabRow({ name: 'Lab B', building: 'E', latitude: '0x10', longitude: '83', radiusMeters: '100' }), /latitude/);
});
