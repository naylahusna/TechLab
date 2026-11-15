import assert from 'node:assert/strict';
import test from 'node:test';
import { createPermissionClassifier, parseClassification } from '../src/features/permission/ai';
import {
  filterPermissions,
  permissionId,
  validateDecision,
  validateSubmission,
  type Permission,
} from '../src/features/permission/model';
import { getAttendanceAction } from '../src/features/practitioner/lib/attendance-action';

test('SRS-15 combines class, session, status and search filters without mutating records', () => {
  const items = Object.freeze([
    Object.freeze({ classId: 'a', sessionId: 'one', status: 'pending', studentName: 'Alya', studentNumber: '123', className: 'A', sessionTitle: 'PPK' }),
    Object.freeze({ classId: 'a', sessionId: 'two', status: 'approved', studentName: 'Bima', studentNumber: '456', className: 'A', sessionTitle: 'PPK' }),
    Object.freeze({ classId: 'b', sessionId: 'one', status: 'pending', studentName: 'Alya', studentNumber: '789', className: 'B', sessionTitle: 'PPK' }),
  ]) as unknown as readonly Permission[];
  assert.deepEqual(filterPermissions(items, 'pending', ' ALYA ', { classId: 'a', sessionId: 'one' }), [items[0]]);
  assert.equal(filterPermissions(items, 'all', '', { classId: 'missing' }).length, 0);
  assert.equal(filterPermissions(items, 'all', '').length, 3);
  assert.equal(items[1].status, 'approved');
});

test('permission input validation, deterministic IDs, rejection reasons and immutable filters', () => {
  assert.deepEqual(validateSubmission('  Saya sakit demam sejak pagi.  ', 'sakit'), {
    reason: 'Saya sakit demam sejak pagi.',
    kind: 'sakit',
  });
  for (const reason of ['', 'short', 'x'.repeat(2001)])
    assert.throws(() => validateSubmission(reason, 'sakit'));
  assert.throws(() => validateSubmission('Valid reason long enough', 'approved'));
  assert.throws(() => permissionId('../invalid', 'user'));
  assert.equal(permissionId('session-a', 'user-a'), 'session-a_user-a');
  assert.throws(() => validateDecision('pending', 'test'));
  assert.throws(() => validateDecision('rejected', '  '));
  assert.deepEqual(validateDecision('approved', ''), { status: 'approved', decisionReason: null });
  const items = Object.freeze([
    Object.freeze({
      studentName: 'Alya',
      studentNumber: '123',
      sessionTitle: 'PPK',
      className: 'A',
      status: 'pending',
    }),
    Object.freeze({
      studentName: 'Bima',
      studentNumber: '456',
      sessionTitle: 'Basis Data',
      className: 'B',
      status: 'approved',
    }),
  ]) as unknown as readonly Permission[];
  assert.deepEqual(filterPermissions(items, 'pending', 'ALYA'), [items[0]]);
  assert.deepEqual(filterPermissions(items, 'all', '456'), [items[1]]);
  assert.equal(items.length, 2);
  assert.ok(getAttendanceAction('dibuka', 'izin').disabled);
  assert.ok(getAttendanceAction('dibuka', 'izin-menunggu').disabled);
});

test('permission AI sends only an identifier and Firebase token to the intermediary, never a provider key', async () => {
  let sent = '';
  let headers: HeadersInit | undefined;
  const response = {
    aiStatus: 'completed', aiCategory: 'sakit', aiConfidence: null,
    aiSource: 'https://teacher.example/v1/chat/completions#test-model', aiError: null,
  };
  const classify = createPermissionClassifier({
    endpoint: 'https://teacher.example/classify',
    fetcher: (async (_url, options) => {
      sent = String(options?.body);
      headers = options?.headers;
      return new Response(JSON.stringify(response));
    }) as typeof fetch,
  });
  const result = await classify('session-a_user-a', true, 'firebase-test-token');
  assert.deepEqual(JSON.parse(sent), { permissionId: 'session-a_user-a' });
  assert.equal(new Headers(headers).get('Authorization'), 'Bearer firebase-test-token');
  assert.equal(result.aiStatus, 'completed');
  assert.equal(result.aiCategory, 'sakit');
  assert.ok(!('status' in result));
  assert.deepEqual(parseClassification(response), response);
  for (const invalid of [
    { ...response, aiCategory: 'positif' },
    { ...response, aiCategory: 'approved' },
    { ...response, aiConfidence: 0.9 },
    { ...response, aiSource: 'https://user:secret@example.com/' },
  ]) assert.throws(() => parseClassification(invalid));
  assert.throws(() => parseClassification({ label: 'approved', score: 4 }));
  assert.throws(() => parseClassification({ decision: 'approved' }));
});

test('AI disabled, no consent, invalid endpoints, HTTP errors, malformed JSON and timeout stay manual', async () => {
  const disabled = createPermissionClassifier();
  assert.equal((await disabled('permission', true, 'token')).aiStatus, 'unavailable');
  let calls = 0;
  const forbidden = createPermissionClassifier({
    endpoint: 'https://teacher.example/classify',
    fetcher: (async () => {
      calls++;
      throw new Error();
    }) as typeof fetch,
  });
  assert.equal((await forbidden('permission', false, 'token')).aiStatus, 'unavailable');
  assert.equal(calls, 0);
  assert.equal(
    (await createPermissionClassifier({ endpoint: 'http://public.example/unsafe' })('x', true, 'token'))
      .aiStatus,
    'unavailable',
  );
  assert.equal((await forbidden('permission', true, 'token')).aiStatus, 'failed');
  for (const response of [
    new Response('bad', { status: 503 }),
    new Response('not json'),
    new Response('{"unexpected":true}'),
  ]) {
    const classify = createPermissionClassifier({
      endpoint: 'https://teacher.example/classify',
      fetcher: (async () => response) as typeof fetch,
    });
    assert.equal((await classify('permission', true, 'token')).aiStatus, 'failed');
  }
  const hanging = createPermissionClassifier({
    endpoint: 'https://teacher.example/classify',
    timeoutMs: 10,
    fetcher: (() => new Promise(() => {})) as typeof fetch,
  });
  assert.equal((await hanging('permission', true, 'token')).aiStatus, 'failed');
});
