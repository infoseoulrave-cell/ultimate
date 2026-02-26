import { appendFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { saveWithEmbedding, semanticSearch } from './vector-store.js';

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
    const vecResult = await saveWithEmbedding(args, ctx).catch(() => null);
    return { ok: true, message: 'Saved to knowledge store', vectorized: vecResult?.vectorized || false };
  } catch (e) {
    return { error: e.message };
  }
}

export async function readKnowledge(args, ctx) {
  const home = ctx?.home;
  if (!home) return { error: 'No home path' };

  const query = (args?.query || '').trim();
  if (query && ctx?._apiKey) {
    try {
      const vecResult = await semanticSearch(query, { ...ctx, limit: args?.limit });
      if (vecResult.results?.length > 0) return { ...vecResult, entries: vecResult.results };
    } catch (_) {}
  }

  const path = getStorePath(home);
  if (!existsSync(path)) return { entries: [], total: 0, method: 'keyword' };
  const q = query.toLowerCase();
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
      if (q) {
        const text = [o.title, o.summary, o.url, (o.tags || []).join(' ')].join(' ').toLowerCase();
        if (!text.includes(q)) continue;
      }
      entries.push({ title: o.title, url: o.url, summary: o.summary?.slice(0, 500), tags: o.tags, at: o.at });
    } catch (_) {}
  }
  return { entries, total: lines.length, method: 'keyword' };
}
