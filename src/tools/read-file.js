import { readFileSync, existsSync, realpathSync } from 'fs';
import { resolve } from 'path';

function normalizePathForCompare(p) {
  const r = resolve(p);
  return r.startsWith('/private/') ? r.slice('/private'.length) : r;
}

function isAllowedByRealpath(resolvedPath, allowDirs) {
  const normalized = normalizePathForCompare(resolvedPath);
  for (const dir of allowDirs || []) {
    const d = normalizePathForCompare(dir);
    if (normalized === d || normalized.startsWith(d + '/') || normalized.startsWith(d + '\\')) return true;
  }
  return false;
}

export async function readFile(pathArg, ctx) {
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
  if (!isAllowedByRealpath(absPath, allowedReal)) {
    return { error: 'Path not in allowed directories', path: pathArg };
  }
  if (!existsSync(absPath)) return { error: 'File not found', path: absPath };
  let realPath;
  try {
    realPath = realpathSync(absPath);
  } catch (e) {
    return { error: e.message, path: absPath };
  }
  if (!isAllowedByRealpath(realPath, allowedReal)) {
    return { error: 'Path not in allowed directories (symlink resolved outside)', path: pathArg };
  }
  try {
    const content = readFileSync(realPath, 'utf8');
    return { content, path: realPath };
  } catch (e) {
    return { error: e.message, path: realPath };
  }
}
