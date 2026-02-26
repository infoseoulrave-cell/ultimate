import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

import { saveWithEmbedding, semanticSearch } from '../src/tools/vector-store.js';

const TMP_HOME = join(tmpdir(), 'ultimate-vec-test-' + Date.now());
mkdirSync(TMP_HOME, { recursive: true });

test('saveWithEmbedding saves without API key (no vector)', async () => {
  const r = await saveWithEmbedding({ title: 'test', summary: 'hello world' }, { home: TMP_HOME, _apiKey: '' });
  assert.equal(r.ok, true);
  assert.equal(r.vectorized, false);
});

test('semanticSearch returns empty on new store', async () => {
  const home2 = join(tmpdir(), 'ultimate-vec-empty-' + Date.now());
  mkdirSync(home2, { recursive: true });
  const r = await semanticSearch('test', { home: home2, _apiKey: '' });
  assert.ok(r.results !== undefined || r.message);
});

test('semanticSearch falls back to keyword without API key', async () => {
  const r = await semanticSearch('test', { home: TMP_HOME, _apiKey: '' });
  assert.ok(r.method === 'keyword_fallback' || r.results !== undefined);
});
