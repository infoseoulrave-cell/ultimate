import { runTool } from '../src/tools/index.js';
import test from 'node:test';
import assert from 'node:assert';

test('restart_self without explicit user request returns error', async () => {
  const ctx = { lastUserContent: '오늘 날씨 어때?' };
  const out = await runTool('restart_self', {}, ctx);
  assert.ok(out && out.error);
  assert.match(String(out.error), /explicit|restart_self|재시작/i);
});

test('restart_self with empty lastUserContent returns error', async () => {
  const out = await runTool('restart_self', {}, {});
  assert.ok(out && out.error);
});

test('restart_self with unrelated user message returns error', async () => {
  const ctx = { lastUserContent: '파일 읽어줘' };
  const out = await runTool('restart_self', {}, ctx);
  assert.ok(out && out.error);
});
