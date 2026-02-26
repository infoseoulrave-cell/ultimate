import { test } from 'node:test';
import assert from 'node:assert/strict';

import { loadSkills, getSkillDefinitions, runSkill, listSkills } from '../src/skills/registry.js';

test('loadSkills loads all skill files', async () => {
  const skills = await loadSkills();
  assert.ok(skills.size >= 4, `Expected at least 4 skills, got ${skills.size}`);
});

test('getSkillDefinitions returns tool definitions', () => {
  const defs = getSkillDefinitions();
  assert.ok(defs.length >= 4);
  for (const d of defs) {
    assert.ok(d.function.name.startsWith('skill_'));
    assert.ok(d.function.description);
  }
});

test('listSkills returns skill info', () => {
  const skills = listSkills();
  assert.ok(skills.length >= 4);
  const names = skills.map(s => s.name);
  assert.ok(names.includes('github'));
  assert.ok(names.includes('web_search'));
  assert.ok(names.includes('notion'));
  assert.ok(names.includes('system_info'));
});

test('runSkill returns error for unknown skill', async () => {
  const r = await runSkill('skill_nonexistent', {}, {});
  assert.ok(r.error);
});

test('system_info skill returns overview', async () => {
  const r = await runSkill('skill_system_info', { action: 'overview' }, {});
  assert.equal(r.ok, true);
  assert.ok(r.hostname);
  assert.ok(r.memory);
});

test('web_search rejects empty query', async () => {
  const r = await runSkill('skill_web_search', { query: '' }, {});
  assert.ok(r.error);
});

test('github skill rejects unknown action', async () => {
  const r = await runSkill('skill_github', { action: 'unknown_action' }, {});
  assert.ok(r.error);
});

test('notion skill requires NOTION_API_KEY', async () => {
  const old = process.env.NOTION_API_KEY;
  delete process.env.NOTION_API_KEY;
  const r = await runSkill('skill_notion', { action: 'search' }, {});
  assert.ok(r.error);
  assert.match(r.error, /NOTION_API_KEY/i);
  if (old) process.env.NOTION_API_KEY = old;
});

test('file_convert rejects nonexistent input', async () => {
  const r = await runSkill('skill_file_convert', { input: '/nonexistent.mp4', output: '/tmp/out.mp3' }, {});
  assert.ok(r.error);
});
