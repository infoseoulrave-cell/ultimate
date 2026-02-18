import { appendFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const FILENAME = 'store.jsonl';

function getStorePath(home) {
  const dir = join(home, 'knowledge');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return join(dir, FILENAME);
}

export async function saveKnowledge(args, ctx) {
  const { url, title, summary } = args;
  const home = ctx?.home;
  if (!home) return { error: 'No home path' };
  const path = getStorePath(home);
  const tags = Array.isArray(args.tags) ? args.tags.slice(0, 10).map(t => String(t).slice(0, 50)) : [];
  const line = JSON.stringify({
    url: url || '',
    title: (title || '').slice(0, 500),
    summary: (summary || '').slice(0, 8000),
    tags,
    at: new Date().toISOString(),
  }) + '\n';
  try {
    appendFileSync(path, line);
    return { ok: true, message: 'Saved to knowledge store' };
  } catch (e) {
    return { error: e.message };
  }
}

export async function readKnowledge(args, ctx) {
  const home = ctx?.home;
  if (!home) return { error: 'No home path' };
  const path = getStorePath(home);
  if (!existsSync(path)) return { entries: [], total: 0 };
  const query = (args?.query || '').toLowerCase().trim();
  const limit = Math.min(Number(args?.limit) || 20, 50);
  let lines;
  try {
    lines = readFileSync(path, 'utf8').trim().split('\n').filter(Boolean);
  } catch (_) {
    return { entries: [], total: 0, error: 'Could not read store' };
  }
  const entries = [];
  for (let i = lines.length - 1; i >= 0 && entries.length < limit; i--) {
    try {
      const o = JSON.parse(lines[i]);
      if (query) {
        const text = [o.title, o.summary, o.url, (o.tags || []).join(' ')].join(' ').toLowerCase();
        if (!text.includes(query)) continue;
      }
      entries.push({ title: o.title, url: o.url, summary: o.summary?.slice(0, 500), tags: o.tags, at: o.at });
    } catch (_) {}
  }
  return { entries, total: lines.length };
}
