import { writeFile } from '../src/tools/write-file.js';
import { join } from 'path';
import { tmpdir } from 'os';
import { readFileSync, existsSync, rmSync, mkdirSync, symlinkSync } from 'fs';
import test from 'node:test';
import assert from 'node:assert';

test('write_file outside allowlist returns error', async () => {
  const ctx = { allowDirs: [join(tmpdir(), 'ultimate-allow-only')] };
  const out = await writeFile('/tmp/ultimate-should-fail.txt', 'x', ctx);
  assert.ok(out.error);
  assert.match(String(out.error), /not in allowed|Path not in allowed/i);
});

test('write_file inside allowlist writes file', async () => {
  const dir = join(tmpdir(), 'ultimate-test-write');
  const ctx = { allowDirs: [dir] };
  const path = join(dir, 'out.txt');
  mkdirSync(dir, { recursive: true });
  const out = await writeFile(path, 'hello world', ctx);
  assert.ok(out.ok);
  assert.strictEqual(readFileSync(path, 'utf8'), 'hello world');
  rmSync(dir, { recursive: true, force: true });
});

test('write_file via symlink parent pointing outside allowlist returns error', async () => {
  const dir = join(tmpdir(), 'ultimate-test-write-symlink');
  const outsideDir = join(tmpdir(), 'ultimate-outside-write');
  mkdirSync(dir, { recursive: true });
  mkdirSync(outsideDir, { recursive: true });
  const linkPath = join(dir, 'linkdir');
  symlinkSync(outsideDir, linkPath);
  const ctx = { allowDirs: [dir] };
  const out = await writeFile(join(linkPath, 'x.txt'), 'x', ctx);
  assert.ok(out.error, 'write via symlink to outside dir should be rejected');
  assert.match(String(out.error), /not in allowed|symlink|outside/i);
  rmSync(dir, { recursive: true, force: true });
  rmSync(outsideDir, { recursive: true, force: true });
});
