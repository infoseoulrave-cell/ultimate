import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runCommand } from '../src/tools/run-command.js';

test('run_command executes basic command', () => {
  const result = runCommand('echo hello');
  assert.equal(result.ok, true);
  assert.equal(result.output, 'hello');
});

test('run_command returns error for empty command', () => {
  const result = runCommand('');
  assert.ok(result.error);
});

test('run_command blocks destructive rm -rf /', () => {
  const result = runCommand('rm -rf /');
  assert.ok(result.error);
  assert.match(result.error, /[Bb]locked/);
});

test('run_command blocks mkfs', () => {
  const result = runCommand('mkfs.ext4 /dev/sda1');
  assert.ok(result.error);
  assert.match(result.error, /[Bb]locked/);
});

test('run_command captures exit code on failure', () => {
  const result = runCommand('exit 42');
  assert.ok(result.error);
  assert.match(result.error, /42/);
});

test('run_command respects cwd', () => {
  const result = runCommand('pwd', { cwd: '/tmp' });
  assert.equal(result.ok, true);
  assert.match(result.output, /\/tmp/);
});

test('run_command handles multi-line output', () => {
  const result = runCommand('echo line1 && echo line2');
  assert.equal(result.ok, true);
  assert.ok(result.output.includes('line1'));
  assert.ok(result.output.includes('line2'));
});
