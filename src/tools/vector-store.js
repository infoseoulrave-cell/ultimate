import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const VECTORS_FILE = 'vectors.json';
const STORE_FILE = 'store.jsonl';

function getDir(home) {
  const dir = join(home, 'knowledge');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

function loadVectors(home) {
  const p = join(getDir(home), VECTORS_FILE);
  if (!existsSync(p)) return [];
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch (_) { return []; }
}

function saveVectors(home, vectors) {
  const p = join(getDir(home), VECTORS_FILE);
  writeFileSync(p, JSON.stringify(vectors));
}

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

async function getEmbedding(text, apiKey, apiBase) {
  const url = `${(apiBase || 'https://api.openai.com/v1').replace(/\/$/, '')}/embeddings`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: text.slice(0, 8000) }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.[0]?.embedding || null;
  } catch (_) {
    return null;
  }
}

export async function saveWithEmbedding(args, ctx) {
  const { title, summary } = args;
  const home = ctx?.home;
  const apiKey = ctx?._apiKey || process.env.OPENAI_API_KEY || '';
  const apiBase = ctx?._apiBase;
  if (!home) return { error: 'No home path' };

  const text = `${title || ''} ${summary || ''}`.trim();
  if (!text) return { error: 'title or summary required' };

  let embedding = null;
  if (apiKey && !apiKey.startsWith('xai-') && !apiKey.startsWith('gsk_')) {
    embedding = await getEmbedding(text, apiKey, apiBase);
  }

  if (embedding) {
    const vectors = loadVectors(home);
    vectors.push({
      id: vectors.length,
      title: (title || '').slice(0, 500),
      summary: (summary || '').slice(0, 2000),
      url: args.url || '',
      tags: Array.isArray(args.tags) ? args.tags.slice(0, 10) : [],
      embedding,
      at: new Date().toISOString(),
    });
    saveVectors(home, vectors);
  }

  return { ok: true, vectorized: !!embedding };
}

export async function semanticSearch(query, ctx) {
  const home = ctx?.home;
  const apiKey = ctx?._apiKey || process.env.OPENAI_API_KEY || '';
  const apiBase = ctx?._apiBase;
  const limit = Math.min(Number(ctx?.limit) || 10, 30);

  if (!home) return { error: 'No home path' };

  const vectors = loadVectors(home);
  if (!vectors.length) return { results: [], total: 0, method: 'vector', message: 'Knowledge store is empty' };

  if (!apiKey || apiKey.startsWith('xai-') || apiKey.startsWith('gsk_')) {
    return keywordFallback(query, vectors, limit);
  }

  const queryEmbedding = await getEmbedding(query, apiKey, apiBase);
  if (!queryEmbedding) {
    return keywordFallback(query, vectors, limit);
  }

  const scored = vectors
    .filter(v => v.embedding)
    .map(v => ({ ...v, score: cosineSimilarity(queryEmbedding, v.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    results: scored.map(v => ({
      title: v.title,
      summary: v.summary?.slice(0, 500),
      url: v.url,
      tags: v.tags,
      score: Math.round(v.score * 1000) / 1000,
      at: v.at,
    })),
    total: vectors.length,
    method: 'semantic',
  };
}

function keywordFallback(query, vectors, limit) {
  const q = (query || '').toLowerCase();
  const results = vectors
    .filter(v => {
      if (!q) return true;
      const text = `${v.title} ${v.summary} ${v.url} ${(v.tags || []).join(' ')}`.toLowerCase();
      return text.includes(q);
    })
    .slice(-limit)
    .reverse();

  return {
    results: results.map(v => ({
      title: v.title,
      summary: v.summary?.slice(0, 500),
      url: v.url,
      tags: v.tags,
      at: v.at,
    })),
    total: vectors.length,
    method: 'keyword_fallback',
  };
}
