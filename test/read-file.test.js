import { readFile } from '../src/tools/read-file.js';
import { join } from 'path';
import { tmpdir } from 'os';
import { writeFileSync, mkdirSync, symlinkSync, rmSync, existsSync } from 'fs';
import test from 'node:test';
import assert from 'node:assert';

test('read_file outside allowlist returns error', async () => {
  const ctx = { allowDirs: [join(tmpdir(), 'allowed-only')] };
  const out = await readFile('/etc/hosts', ctx);
  assert.ok(out.error);
  assert.match(String(out.error), /not in allowed|Path not in allowed/i);
});

test('read_file inside allowlist returns content', async () => {
  const dir = join(tmpdir(), 'ultimate-test-read');
  const ctx = { allowDirs: [dir] };
  const path = join(dir, 'f.txt');
  mkdirSync(dir, { recursive: true });
  writeFileSync(path, 'hello', 'utf8');
  const out = await readFile(path, ctx);
  assert.ok(out.content === 'hello');
});

test('read_file symlink pointing outside allowlist returns error', async () => {
  const dir = join(tmpdir(), 'ultimate-test-read-symlink');
  const outsideDir = join(tmpdir(), 'ultimate-outside-read');
  mkdirSync(dir, { recursive: true });
  mkdirSync(outsideDir, { recursive: true });
  const outsideFile = join(outsideDir, 'secret.txt');
  writeFileSync(outsideFile, 'secret', 'utf8');
  const linkPath = join(dir, 'link');
  symlinkSync(outsideFile, linkPath);
  const ctx = { allowDirs: [dir] };
  const out = await readFile(linkPath, ctx);
  assert.ok(out.error, 'symlink to file outside allowlist should be rejected');
  assert.match(String(out.error), /not in allowed|symlink|outside/i);
  rmSync(dir, { recursive: true, force: true });
  rmSync(outsideDir, { recursive: true, force: true });
});
