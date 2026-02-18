import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

function logPath(home, kind = 'session') {
  const dir = join(home, 'logs');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  return join(dir, `${kind}-${date}.log`);
}

function line(level, payload) {
  const ts = new Date().toISOString();
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return `${ts}\t${level}\t${body}\n`;
}

export function writeLog(home, level, payload) {
  try {
    appendFileSync(logPath(home, 'session'), line(level, payload));
  } catch (_) {}
}

export function writeCallLog(home, entry) {
  try {
    appendFileSync(logPath(home, 'calls'), line('call', entry));
  } catch (_) {}
}

export function getLogDir(home) {
  const dir = join(home, 'logs');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

/** Audit: do not log file/URL/body/summary. Only path, url, success/error. */
export function redactToolUses(toolUses) {
  return (toolUses || []).map((t) => {
    const { name, args } = t;
    if (name === 'read_file') return { name, args: { path: args?.path }, result: '[redacted: path-only]' };
    if (name === 'fetch_url') return { name, args: { url: args?.url }, result: '[redacted: no body]' };
    if (name === 'write_file') return { name, args: { path: args?.path }, result: '[redacted: path-only]' };
    if (name === 'save_knowledge') return { name, args: {}, result: '[redacted: no summary]' };
    if (name === 'finish_goal') return { name, args: { result: args?.result }, result: '[redacted]' };
    if (name === 'restart_self') return { name, args: {}, result: '[restarted]' };
    return { name, args, result: t.result?.length > 200 ? t.result.slice(0, 200) + '...' : t.result };
  });
}
