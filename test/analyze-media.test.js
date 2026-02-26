import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

import { analyzeImage } from '../src/tools/analyze-image.js';
import { transcribeAudio } from '../src/tools/transcribe-audio.js';
import { analyzeVideo } from '../src/tools/analyze-video.js';

const TMP = join(tmpdir(), 'ultimate-media-test-' + Date.now());
mkdirSync(TMP, { recursive: true });

test('analyze_image rejects missing path', async () => {
  const r = await analyzeImage('', null, {});
  assert.ok(r.error);
});

test('analyze_image rejects file not found', async () => {
  const r = await analyzeImage('/tmp/nonexistent-image-xyz.jpg', null, { allowDirs: ['/tmp'] });
  assert.ok(r.error);
  assert.match(r.error, /not found/i);
});

test('analyze_image rejects unsupported format', async () => {
  const p = join(TMP, 'test.txt');
  writeFileSync(p, 'hello');
  const r = await analyzeImage(p, null, { allowDirs: [TMP] });
  assert.ok(r.error);
  assert.match(r.error, /not a supported/i);
  unlinkSync(p);
});

test('analyze_image rejects path outside allowlist', async () => {
  const p = join(TMP, 'test.jpg');
  writeFileSync(p, Buffer.from([0xFF, 0xD8, 0xFF]));
  const r = await analyzeImage(p, null, { allowDirs: ['/nonexistent'] });
  assert.ok(r.error);
  assert.match(r.error, /not in allowed/i);
  unlinkSync(p);
});

test('analyze_image requires API key', async () => {
  const p = join(TMP, 'test.png');
  writeFileSync(p, Buffer.alloc(100));
  const r = await analyzeImage(p, null, { allowDirs: [TMP], apiKey: '' });
  assert.ok(r.error);
  assert.match(r.error, /API key/i);
  unlinkSync(p);
});

test('transcribe_audio rejects missing path', async () => {
  const r = await transcribeAudio('', {});
  assert.ok(r.error);
});

test('transcribe_audio rejects unsupported format', async () => {
  const p = join(TMP, 'test.xyz');
  writeFileSync(p, 'data');
  const r = await transcribeAudio(p, { allowDirs: [TMP] });
  assert.ok(r.error);
  assert.match(r.error, /not a supported/i);
  unlinkSync(p);
});

test('transcribe_audio rejects path outside allowlist', async () => {
  const p = join(TMP, 'test.mp3');
  writeFileSync(p, Buffer.alloc(100));
  const r = await transcribeAudio(p, { allowDirs: ['/nonexistent'] });
  assert.ok(r.error);
  assert.match(r.error, /not in allowed/i);
  unlinkSync(p);
});

test('analyze_video rejects missing path', async () => {
  const r = await analyzeVideo('', null, {});
  assert.ok(r.error);
});

test('analyze_video rejects unsupported format', async () => {
  const p = join(TMP, 'test.doc');
  writeFileSync(p, 'data');
  const r = await analyzeVideo(p, null, { allowDirs: [TMP] });
  assert.ok(r.error);
  assert.match(r.error, /not a supported/i);
  unlinkSync(p);
});

test('analyze_video rejects path outside allowlist', async () => {
  const p = join(TMP, 'test.mp4');
  writeFileSync(p, Buffer.alloc(100));
  const r = await analyzeVideo(p, null, { allowDirs: ['/nonexistent'] });
  assert.ok(r.error);
  assert.match(r.error, /not in allowed/i);
  unlinkSync(p);
});
