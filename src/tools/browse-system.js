import { readdirSync, statSync, existsSync } from 'fs';
import { join, resolve, extname } from 'path';
import { execSync } from 'child_process';
import { homedir } from 'os';

export function listDirectory(pathArg, args = {}) {
  const dirPath = resolve(pathArg || homedir());
  if (!existsSync(dirPath)) return { error: `Directory not found: ${dirPath}` };

  try {
    const stat = statSync(dirPath);
    if (!stat.isDirectory()) return { error: `Not a directory: ${dirPath}` };
  } catch (e) {
    return { error: `Cannot access: ${e.message}` };
  }

  const showHidden = args.show_hidden || false;
  const limit = Math.min(Number(args.limit) || 100, 500);

  try {
    const entries = readdirSync(dirPath, { withFileTypes: true });
    const items = [];
    for (const entry of entries) {
      if (!showHidden && entry.name.startsWith('.')) continue;
      if (items.length >= limit) break;
      let size = '';
      let modified = '';
      try {
        const s = statSync(join(dirPath, entry.name));
        size = s.isFile() ? formatSize(s.size) : '';
        modified = s.mtime.toISOString().slice(0, 16);
      } catch (_) {}
      items.push({
        name: entry.name,
        type: entry.isDirectory() ? 'dir' : entry.isSymbolicLink() ? 'link' : 'file',
        size,
        modified,
      });
    }
    items.sort((a, b) => (a.type === 'dir' ? 0 : 1) - (b.type === 'dir' ? 0 : 1) || a.name.localeCompare(b.name));
    return { ok: true, path: dirPath, items, total: items.length };
  } catch (e) {
    return { error: `Cannot read directory: ${e.message}` };
  }
}

export function findFiles(query, args = {}) {
  if (!query) return { error: 'query is required (filename pattern or search term)' };

  const searchPath = resolve(args.path || homedir());
  const maxResults = Math.min(Number(args.limit) || 30, 100);
  const type = args.type || 'all';

  const typeFlag = type === 'dir' ? '-type d' : type === 'file' ? '-type f' : '';
  const namePattern = query.includes('*') ? query : `*${query}*`;

  try {
    const cmd = `find "${searchPath}" -maxdepth ${args.depth || 5} ${typeFlag} -iname "${namePattern}" 2>/dev/null | head -${maxResults}`;
    const out = execSync(cmd, { encoding: 'utf8', timeout: 10000 }).trim();
    const files = out ? out.split('\n').filter(Boolean) : [];
    return {
      ok: true,
      query,
      searchPath,
      results: files.map(f => {
        try {
          const s = statSync(f);
          return { path: f, type: s.isDirectory() ? 'dir' : 'file', size: formatSize(s.size) };
        } catch (_) {
          return { path: f };
        }
      }),
      count: files.length,
    };
  } catch (e) {
    return { error: `Search failed: ${e.message}` };
  }
}

export function treeView(pathArg, args = {}) {
  const dirPath = resolve(pathArg || process.cwd());
  if (!existsSync(dirPath)) return { error: `Not found: ${dirPath}` };

  const depth = Math.min(Number(args.depth) || 3, 5);
  try {
    const out = execSync(`find "${dirPath}" -maxdepth ${depth} -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | head -200`, {
      encoding: 'utf8', timeout: 10000,
    }).trim();
    return { ok: true, path: dirPath, tree: out, depth };
  } catch (e) {
    return { error: `Tree view failed: ${e.message}` };
  }
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + 'KB';
  if (bytes < 1024 * 1024 * 1024) return Math.round(bytes / 1024 / 1024) + 'MB';
  return Math.round(bytes / 1024 / 1024 / 1024 * 10) / 10 + 'GB';
}
