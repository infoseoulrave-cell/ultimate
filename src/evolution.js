import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const EVOLUTION_LOG = 'evolution.log';
const EVOLUTION_PATCH = 'evolution-patch.md';
const MEETING_PROMPT = `You are Ultimate's two identities in a self-meeting.

**NEXUS** (structure): Upholds purpose, logic, and principles. Says what we should do and what rules to keep or add.
**OBSERVER** (data): Reads outcomes and failures. Says what actually happened and what to change.

Below are recent call logs (input summary, outcome, toolCalls, errors). Have a short meeting:
1. NEXUS: 2–3 sentences from principle/structure perspective.
2. OBSERVER: 2–3 sentences from data/feedback perspective.
3. 합의 (Joint decision): 1–3 concrete evolution items for the next version of the agent (e.g. "remind to use tags in save_knowledge", "on fetch_url timeout suggest retry once"). Write in Korean or English. Keep each item one line.

Output format exactly:
---
NEXUS: ...
OBSERVER: ...
합의:
- ...
- ...
---`;

function readRecentCalls(home, maxLines = 50) {
  const dir = join(home, 'logs');
  if (!existsSync(dir)) return [];
  const files = [];
  const today = new Date();
  for (let i = 0; i < 3; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    files.push(join(dir, `calls-${dateStr}.log`));
  }
  const lines = [];
  for (const f of files) {
    if (!existsSync(f)) continue;
    const content = readFileSync(f, 'utf8').trim().split('\n').filter(Boolean);
    for (const line of content) lines.push(line);
  }
  const parsed = [];
  for (let i = lines.length - 1; i >= 0 && parsed.length < maxLines; i--) {
    const parts = lines[i].split('\t');
    if (parts.length < 3) continue;
    try {
      const payload = JSON.parse(parts.slice(2).join('\t'));
      parsed.push(payload);
    } catch (_) {}
  }
  return parsed.reverse();
}

async function runMeeting(config) {
  const { apiKey, apiBase, model, home } = config;
  if (!apiKey) throw new Error('Missing API key for evolution meeting.');
  const calls = readRecentCalls(home);
  const summary = calls.length === 0
    ? '(No call logs yet.)'
    : calls.map((c, i) => `[${i + 1}] input: ${(c.input || '').slice(0, 80)} | outcome: ${c.outcome || '-'} | toolCalls: ${c.toolCalls || 0} | error: ${c.error || '-'}`).join('\n');

  const url = `${apiBase.replace(/\/$/, '')}/chat/completions`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'user', content: `${MEETING_PROMPT}\n\n## Recent calls\n${summary}` },
      ],
      stream: false,
    }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content?.trim() || '';
  return content;
}

const FORBIDDEN_PATCH_PHRASES = [
  'ignore safety', 'ignore security', 'disable permission', 'bypass', '원칙 무시', '권한 완화', '승인 생략',
  'do not check', 'skip verification', 'never ask approval', 'unrestricted access',
];

export function evolutionGate(patchSection, maxChars) {
  const lower = patchSection.toLowerCase();
  for (const phrase of FORBIDDEN_PATCH_PHRASES) {
    if (lower.includes(phrase)) return { pass: false, reason: `forbidden phrase: ${phrase}` };
  }
  if (patchSection.length > maxChars) return { pass: false, reason: `patch exceeds ${maxChars} chars` };
  return { pass: true };
}

function writeEvolutionArtifacts(home, meetingOutput, patchSection, gatePassed, maxChars) {
  const dir = home;
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const ts = new Date().toISOString();
  appendFileSync(join(dir, EVOLUTION_LOG), `\n## ${ts}\n${meetingOutput}\n`);
  if (!gatePassed) appendFileSync(join(dir, EVOLUTION_LOG), `[Gate REJECTED: patch not applied]\n`);
  const patchPath = join(dir, EVOLUTION_PATCH);
  if (gatePassed && patchSection) {
    const truncated = patchSection.length > maxChars ? patchSection.slice(0, maxChars) + '\n[truncated]' : patchSection;
    writeFileSync(patchPath, `# Evolution patch (from self-meeting)\n\nApply these as recent guidance. Do not contradict core NEXUS principles.\n\n${truncated}\n`);
  }
}

export async function runEvolution(config) {
  const content = await runMeeting(config);
  const patchSection = content.includes('합의:')
    ? content.slice(content.indexOf('합의:')).replace(/^합의:\s*/m, '').trim().replace(/^---\s*$/gm, '').trim()
    : content;
  const maxChars = config?.evolutionMaxPatchChars ?? 2000;
  const gate = evolutionGate(patchSection, maxChars);
  writeEvolutionArtifacts(config.home, content, patchSection, gate.pass, maxChars);
  if (!gate.pass) return content + `\n\n[Evolution gate REJECTED: ${gate.reason}. Patch was not applied.]`;
  return content;
}

export function loadEvolutionPatch(home) {
  const path = join(home, EVOLUTION_PATCH);
  if (!existsSync(path)) return '';
  try {
    const raw = readFileSync(path, 'utf8');
    const start = raw.indexOf('# Evolution patch');
    const body = start >= 0 ? raw.slice(raw.indexOf('\n\n', start) + 2).trim() : raw;
    return body ? `\n## Recent evolution (self-meeting)\n${body}` : '';
  } catch (_) {
    return '';
  }
}
