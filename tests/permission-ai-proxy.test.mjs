import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { createPermissionAiServer, createProviderClassifier, parseProviderCategory } from '../server/permission-ai.mjs';

const success = { choices: [{ finish_reason: 'stop', message: { content: '{"category":"sakit"}' } }] };
const config = { baseUrl: 'https://provider.example/v1', apiKey: 'private-provider-test-key', model: 'test-model' };

test('provider request contains only stored reason and static instructions; result is advisory without invented confidence', async () => {
  let sent;
  const classify = createProviderClassifier({ ...config, fetcher: async (_url, options) => {
    sent = options;
    return new Response(JSON.stringify(success));
  } });
  const result = await classify('Saya sedang sakit dan perlu istirahat.');
  assert.equal(result.aiCategory, 'sakit');
  assert.equal(result.aiConfidence, null);
  assert.equal(result.aiSource, 'https://provider.example/v1/chat/completions#test-model');
  assert.equal(sent.headers.Authorization, `Bearer ${config.apiKey}`);
  assert.deepEqual(JSON.parse(JSON.parse(sent.body).messages[1].content), {
    reason: 'Saya sedang sakit dan perlu istirahat.',
  });
  assert.ok(!('status' in result));
  assert.ok(!JSON.stringify(result).includes(config.apiKey));
  for (const invalid of ['{"category":"positif"}', '{"category":"approved"}',
    '{"category":"sakit","approved":true}', 'not-json', '{"category":"sakit","confidence":0.9}'])
    assert.throws(() => parseProviderCategory(invalid));
});

test('unknown output, rate limits, malformed JSON and timeout remain manual without exposing upstream errors', async () => {
  const ambiguous = createProviderClassifier({ ...config, fetcher: async () => new Response(JSON.stringify({
    choices: [{ finish_reason: 'stop', message: { content: '{"category":null}' } }],
  })) });
  assert.equal((await ambiguous('Alasan yang belum dapat dipastikan.')).aiStatus, 'unavailable');
  for (const response of [new Response(config.apiKey, { status: 429 }), new Response('bad json'),
    new Response(JSON.stringify({ choices: [{ finish_reason: 'length', message: { content: '{"category":"sakit"}' } }] }))]) {
    const classify = createProviderClassifier({ ...config, fetcher: async () => response });
    const failed = await classify('Saya sedang sakit dan perlu istirahat.');
    assert.equal(failed.aiStatus, 'failed');
    assert.equal(failed.aiCategory, null);
    assert.ok(!JSON.stringify(failed).includes(config.apiKey));
  }
  const hanging = createProviderClassifier({ ...config, timeoutMs: 5, fetcher: () => new Promise(() => {}) });
  assert.equal((await hanging('Saya sedang sakit dan perlu istirahat.')).aiStatus, 'failed');
});

test('intermediary enforces Firebase identity, ownership, consent, CORS and per-user limits before using provider key', async () => {
  const providerCalls = [];
  let owner = 'student-test'; let consent = true; let role = 'praktikan';
  const server = createPermissionAiServer({ ...config,
    firebaseProjectId: 'techlab-naylahusna-2026', firebaseApiKey: 'firebase-public-test',
    maxRequestsPerMinute: 1,
    fetcher: async (url, options) => {
      url = String(url);
      if (url.includes('accounts:lookup')) {
        assert.equal(JSON.parse(options.body).idToken, 'firebase-id-token');
        return Response.json({ users: [{ localId: 'student-test' }] });
      }
      if (url.includes('/users/')) return Response.json({ fields: { role: { stringValue: role } } });
      if (url.includes('/permissions/')) return Response.json({ fields: {
        userId: { stringValue: owner }, aiConsent: { booleanValue: consent },
        aiStatus: { stringValue: 'processing' }, aiClassifiedAt: { timestampValue: new Date().toISOString() },
        reason: { stringValue: 'Saya sedang sakit dan perlu beristirahat.' },
      } });
      providerCalls.push({ url, options });
      return Response.json(success);
    },
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/permission/classify`;
  const request = (headers = {}, body = { permissionId: 'session_student-test' }) => fetch(base, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body),
  });
  const auth = { Authorization: 'Bearer firebase-id-token' };
  try {
    assert.equal((await request()).status, 401);
    assert.equal((await request({ ...auth, Origin: 'https://untrusted.example' })).status, 403);
    assert.equal((await request(auth, { permissionId: 'valid', reason: 'Not allowed client text' })).status, 400);
    owner = 'another-student'; assert.equal((await request(auth)).status, 403); owner = 'student-test';
    consent = false; assert.equal((await request(auth)).status, 403); consent = true;
    role = 'asisten'; assert.equal((await request(auth)).status, 403); role = 'praktikan';
    assert.equal(providerCalls.length, 0);
    const response = await request({ ...auth, Origin: 'http://localhost:8084' });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'http://localhost:8084');
    const result = await response.json(); assert.equal(result.aiCategory, 'sakit');
    assert.equal(providerCalls.length, 1);
    assert.ok(!providerCalls[0].options.body.includes('student-test'));
    assert.ok(!providerCalls[0].options.body.includes('firebase-id-token'));
    assert.equal((await request(auth)).status, 429);
  } finally { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
});
