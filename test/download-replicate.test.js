import { test } from 'node:test';
import assert from 'node:assert/strict';

import { downloadMedia } from '../src/tools/download-media.js';
import { replicateReference } from '../src/tools/replicate-reference.js';

test('download_media rejects missing url', async () => {
  const r = await downloadMedia('', {}, {});
  assert.ok(r.error);
});

test('download_media rejects non-http url', async () => {
  const r = await downloadMedia('ftp://example.com/file.mp4', {}, {});
  assert.ok(r.error);
  assert.match(r.error, /http/i);
});

test('download_media rejects file:// protocol', async () => {
  const r = await downloadMedia('file:///etc/passwd', {}, {});
  assert.ok(r.error);
});

test('replicate_reference rejects missing url', async () => {
  const r = await replicateReference('', null, {});
  assert.ok(r.error);
});

test('replicate_reference rejects invalid url', async () => {
  const r = await replicateReference('not-a-url', null, {});
  assert.ok(r.error);
});

test('download_media handles invalid direct URL gracefully', async () => {
  const r = await downloadMedia('https://httpbin.org/status/404', {}, {});
  assert.ok(r.error || r.ok === false || r.error);
});
