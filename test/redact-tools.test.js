import { redactToolUses } from '../src/log.js';
import test from 'node:test';
import assert from 'node:assert';

test('redactToolUses redacts read_file result', () => {
  const uses = [{ name: 'read_file', args: { path: '/a/b' }, result: 'secret content' }];
  const out = redactToolUses(uses);
  assert.strictEqual(out[0].result, '[redacted: path-only]');
  assert.strictEqual(out[0].args.path, '/a/b');
});

test('redactToolUses redacts fetch_url result', () => {
  const uses = [{ name: 'fetch_url', args: { url: 'https://x.com' }, result: 'full body here' }];
  const out = redactToolUses(uses);
  assert.strictEqual(out[0].result, '[redacted: no body]');
});

test('redactToolUses redacts save_knowledge', () => {
  const uses = [{ name: 'save_knowledge', args: { summary: 'secret' }, result: 'ok' }];
  const out = redactToolUses(uses);
  assert.strictEqual(out[0].result, '[redacted: no summary]');
  assert.deepStrictEqual(out[0].args, {});
});

test('redactToolUses leaves other tools limited', () => {
  const uses = [{ name: 'run_openclaw', args: {}, result: 'x'.repeat(300) }];
  const out = redactToolUses(uses);
  assert.ok(out[0].result.length <= 210);
  assert.ok(out[0].result.endsWith('...'));
});
