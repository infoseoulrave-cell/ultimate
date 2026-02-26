import { readFileSync, existsSync, realpathSync } from 'fs';
import { resolve, extname } from 'path';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.tif'];
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

const MIME_MAP = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.gif': 'image/gif',
  '.webp': 'image/webp', '.bmp': 'image/bmp',
  '.tiff': 'image/tiff', '.tif': 'image/tiff',
};

function isAllowed(absPath, allowDirs) {
  const norm = (p) => { const r = resolve(p); return r.startsWith('/private/') ? r.slice('/private'.length) : r; };
  const n = norm(absPath);
  for (const d of allowDirs || []) {
    const nd = norm(d);
    if (n === nd || n.startsWith(nd + '/')) return true;
  }
  return false;
}

export async function analyzeImage(pathArg, question, ctx) {
  if (!pathArg) return { error: 'path is required' };
  const allowDirs = ctx?.allowDirs || [process.cwd()];
  const absPath = pathArg.startsWith('/') ? pathArg : resolve(process.cwd(), pathArg);

  const realAllowDirs = allowDirs.map(d => { try { return realpathSync(resolve(d)); } catch (_) { return resolve(d); } });
  if (!isAllowed(absPath, realAllowDirs)) return { error: 'Path not in allowed directories', path: pathArg };
  if (!existsSync(absPath)) return { error: 'File not found', path: absPath };

  let realPath;
  try { realPath = realpathSync(absPath); } catch (e) { return { error: e.message }; }
  if (!isAllowed(realPath, realAllowDirs)) return { error: 'Path not in allowed directories (symlink)', path: pathArg };

  const ext = extname(realPath).toLowerCase();
  if (!IMAGE_EXTENSIONS.includes(ext)) return { error: `Not a supported image format (${ext}). Supported: ${IMAGE_EXTENSIONS.join(', ')}` };

  const stat = readFileSync(realPath);
  if (stat.length > MAX_IMAGE_BYTES) return { error: `Image too large (${Math.round(stat.length / 1024 / 1024)}MB). Max: ${MAX_IMAGE_BYTES / 1024 / 1024}MB` };

  const base64 = stat.toString('base64');
  const mime = MIME_MAP[ext] || 'image/jpeg';
  const dataUrl = `data:${mime};base64,${base64}`;

  const apiKey = ctx?.apiKey || process.env.OPENAI_API_KEY || process.env.XAI_API_KEY || '';
  const apiBase = ctx?.apiBase || process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';
  const model = ctx?.visionModel || ctx?.model || 'gpt-4o-mini';

  if (!apiKey) return { error: 'API key required for image analysis' };

  const prompt = question || '이 이미지를 자세히 분석하고 설명해줘. 중요한 세부사항, 텍스트, 객체, 색상, 레이아웃을 모두 포함해서.';

  const messages = [
    {
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: dataUrl, detail: 'high' } },
      ],
    },
  ];

  try {
    const url = `${apiBase.replace(/\/$/, '')}/chat/completions`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages, max_tokens: 2000 }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      return { error: `Vision API error ${res.status}: ${t.slice(0, 200)}` };
    }
    const data = await res.json();
    const analysis = data.choices?.[0]?.message?.content?.trim() || '';
    return { ok: true, analysis, path: realPath, size: `${Math.round(stat.length / 1024)}KB`, format: ext };
  } catch (e) {
    return { error: `Vision API request failed: ${e.message}` };
  }
}
