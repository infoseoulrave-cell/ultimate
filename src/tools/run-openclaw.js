import { spawn } from 'child_process';

const DEFAULT_TIMEOUT_MS = 60000;

export async function runOpenClaw(message, ctx) {
  const bin = ctx?.openclawPath || 'openclaw';
  const timeoutMs = ctx?.openclawTimeout ?? DEFAULT_TIMEOUT_MS;
  return new Promise((resolve) => {
    let done = false;
    const finish = (payload) => {
      if (done) return;
      done = true;
      clearTimeout(to);
      resolve(payload);
    };
    const child = spawn(bin, ['agent', '--message', message], {
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    let err = '';
    let killTimeout = null;
    const to = setTimeout(() => {
      try { child.kill('SIGTERM'); } catch (_) {}
      killTimeout = setTimeout(() => {
        try { child.kill('SIGKILL'); } catch (_) {}
        finish({ error: `Timeout after ${timeoutMs}ms`, stdout: out, stderr: err });
      }, 2000);
    }, timeoutMs);
    child.stdout?.on('data', (d) => { out += d.toString(); });
    child.stderr?.on('data', (d) => { err += d.toString(); });
    child.on('close', (code) => {
      if (killTimeout) {
        clearTimeout(killTimeout);
        killTimeout = null;
      }
      if (code !== 0 && code != null) finish({ error: err || `exit ${code}`, stdout: out });
      else finish({ stdout: out, stderr: err || undefined });
    });
    child.on('error', (e) => finish({ error: e.message }));
  });
}
