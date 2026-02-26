import { execSync } from 'child_process';
import { resolve } from 'path';

const BLOCKED_PATTERNS = [
  /rm\s+-rf\s+\/(?!\w)/i,
  /mkfs/i,
  /dd\s+if=.*of=\/dev/i,
  /:(){ :|:& };:/,
  />\s*\/dev\/sd/i,
  /format\s+[a-z]:/i,
];

export function runCommand(command, args = {}, ctx = {}) {
  const cmd = String(command || '').trim();
  if (!cmd) return { error: 'command is required' };

  for (const pat of BLOCKED_PATTERNS) {
    if (pat.test(cmd)) return { error: `Blocked: destructive command pattern detected.` };
  }

  const cwd = args.cwd ? resolve(args.cwd) : process.cwd();
  const timeoutMs = Math.min(Math.max(Number(args.timeout_seconds) || 30, 1) * 1000, 120000);

  try {
    const stdout = execSync(cmd, {
      cwd,
      timeout: timeoutMs,
      maxBuffer: 1024 * 1024,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });
    const output = (stdout || '').trim();
    const truncated = output.length > 8000;
    return {
      ok: true,
      output: truncated ? output.slice(0, 8000) + '\n...[truncated]' : output,
      cwd,
    };
  } catch (e) {
    const stderr = e.stderr ? String(e.stderr).trim().slice(0, 4000) : '';
    const stdout = e.stdout ? String(e.stdout).trim().slice(0, 4000) : '';
    if (e.killed) {
      return { error: `Command timed out after ${timeoutMs / 1000}s`, stderr, stdout };
    }
    return {
      error: `Exit code ${e.status ?? 'unknown'}`,
      stderr,
      stdout,
    };
  }
}
