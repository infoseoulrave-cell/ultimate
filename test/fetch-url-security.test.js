import { fetchUrl } from '../src/tools/fetch-url.js';
import test from 'node:test';
import assert from 'node:assert';

test('fetch_url rejects file protocol', async () => {
  const out = await fetchUrl('file:///etc/passwd', {});
  assert.ok(out.error);
  assert.match(String(out.error), /not allowed|file|private/i);
});

test('fetch_url rejects localhost', async () => {
  const out = await fetchUrl('http://localhost:9999/', {});
  assert.ok(out.error);
  assert.match(String(out.error), /not allowed|localhost|private/i);
});

test('fetch_url rejects 127.0.0.1', async () => {
  const out = await fetchUrl('http://127.0.0.1/', {});
  assert.ok(out.error);
  assert.match(String(out.error), /not allowed|private/i);
});

test('fetch_url rejects private IP hostnames', async () => {
  const out = await fetchUrl('http://192.168.1.1/', {});
  assert.ok(out.error);
  assert.match(String(out.error), /not allowed|private/i);
});

test('fetch_url rejects 10.x hostname', async () => {
  const out = await fetchUrl('http://10.0.0.1/', {});
  assert.ok(out.error);
});

test('fetch_url rejects link-local hostname', async () => {
  const out = await fetchUrl('http://169.254.1.1/', {});
  assert.ok(out.error);
});
