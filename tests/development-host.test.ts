import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveDevelopmentHost, resolveLocalServiceUrl } from '../src/services/firebase/development-host';

test('emulator follows current Metro LAN address while tunnel and absent hosts keep explicit fallback', () => {
  assert.equal(resolveDevelopmentHost('10.137.45.203', '10.137.183.250:8081'), '10.137.183.250');
  assert.equal(resolveDevelopmentHost('10.137.45.203', '172.20.10.2:8081'), '172.20.10.2');
  assert.equal(resolveDevelopmentHost('10.137.45.203', 'localhost:8081'), 'localhost');
  for (const uri of [undefined, '', 'abc.exp.direct:80', '8.8.8.8:8081', '10.999.0.1:8081']) {
    assert.equal(resolveDevelopmentHost('10.137.45.203', uri), '10.137.45.203');
  }
});

test('only same-laptop HTTP AI endpoint follows emulator host; cloud and separate servers are preserved', () => {
  const old = 'http://10.137.45.203:8787/permission/classify';
  assert.equal(resolveLocalServiceUrl(old, '10.137.45.203', '172.20.10.2', true), 'http://172.20.10.2:8787/permission/classify');
  assert.equal(resolveLocalServiceUrl(old, '10.137.45.203', '172.20.10.2', false), old);
  for (const url of ['https://teacher.example/classify', 'http://192.168.1.4:8787/classify', 'bad-url', undefined]) {
    assert.equal(resolveLocalServiceUrl(url, '10.137.45.203', '172.20.10.2', true), url);
  }
});
