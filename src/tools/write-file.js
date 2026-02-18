import { writeFileSync, existsSync, mkdirSync, realpathSync } from 'fs';
import { resolve, dirname, basename } from 'path';

function normalizePathForCompare(p) {
  const r = resolve(p);
  return r.startsWith('/private/') ? r.slice('/private'.length) : r;
}

function isAllowedByRealpath(resolvedPath, allowedReal) {
  const normalized = normalizePathForCompare(resolvedPath);
  for (const d of allowedReal) {
    const nd = normalizePathForCompare(d);
    if (normalized === nd || normalized.startsWith(nd + '/') || normalized.startsWith(nd + '\\')) return true;
  }
  return false;
}

export async function writeFile(pathArg, content, ctx) {
  if (pathArg == null || typeof pathArg !== 'string') return { error: 'invalid path' };
  const allowDirs = ctx?.allowDirs || [process.cwd()];
  const base = process.cwd();
  const absPath = pathArg.startsWith('/') ? pathArg : resolve(base, pathArg);
  const allowedReal = allowDirs.map((d) => {
    try {
      return realpathSync(resolve(d));
    } catch (_) {
      return resolve(d);
    }
  });
  const dir = dirname(absPath);
  let realDir;
  try {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    realDir = realpathSync(dir);
  } catch (e) {
    return { error: e.message, path: pathArg };
  }
  const targetPath = resolve(realDir, basename(absPath));
  if (!isAllowedByRealpath(targetPath, allowedReal)) {
    return { error: 'Path not in allowed directories (parent symlink resolved outside)', path: pathArg };
  }
  try {
    writeFileSync(targetPath, typeof content === 'string' ? content : JSON.stringify(content), 'utf8');
    return { ok: true, path: targetPath };
  } catch (e) {
    return { error: e.message, path: targetPath };
  }
}
