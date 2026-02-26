import { readFileSync, existsSync, realpathSync, writeFileSync, unlinkSync, mkdirSync } from 'fs';
import { resolve, extname, join, basename } from 'path';
import { execSync } from 'child_process';
import { tmpdir } from 'os';

const AUDIO_EXTENSIONS = ['.mp3', '.mp4', '.m4a', '.wav', '.flac', '.ogg', '.opus', '.webm', '.aac', '.wma'];
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

function isAllowed(absPath, allowDirs) {
  const norm = (p) => { const r = resolve(p); return r.startsWith('/private/') ? r.slice('/private'.length) : r; };
  const n = norm(absPath);
  for (const d of allowDirs || []) {
    const nd = norm(d);
    if (n === nd || n.startsWith(nd + '/')) return true;
  }
  return false;
}

function convertToMp3(inputPath) {
  const tmpDir = join(tmpdir(), 'ultimate-audio');
  mkdirSync(tmpDir, { recursive: true });
  const outPath = join(tmpDir, `convert-${Date.now()}.mp3`);
  try {
    execSync(`ffmpeg -y -i "${inputPath}" -ar 16000 -ac 1 -b:a 64k "${outPath}" 2>/dev/null`, { timeout: 60000 });
    return outPath;
  } catch (e) {
    return null;
  }
}

export async function transcribeAudio(pathArg, ctx) {
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
  if (!AUDIO_EXTENSIONS.includes(ext)) return { error: `Not a supported audio format (${ext}). Supported: ${AUDIO_EXTENSIONS.join(', ')}` };

  let audioPath = realPath;
  let tempFile = null;
  const fileSize = readFileSync(realPath).length;

  if (fileSize > MAX_AUDIO_BYTES || !['.mp3', '.m4a', '.wav', '.flac', '.ogg', '.webm'].includes(ext)) {
    audioPath = convertToMp3(realPath);
    if (!audioPath) return { error: 'Failed to convert audio. Ensure ffmpeg is installed.' };
    tempFile = audioPath;
  }

  const apiKey = ctx?.apiKey || process.env.OPENAI_API_KEY || '';
  const apiBase = ctx?.apiBase || process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';

  if (!apiKey) return { error: 'OpenAI API key required for audio transcription (Whisper)' };

  try {
    const audioData = readFileSync(audioPath);
    const boundary = '----UltimateAudioBoundary' + Date.now();
    const fileName = basename(audioPath);

    const parts = [];
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: audio/mpeg\r\n\r\n`);
    parts.push(audioData);
    parts.push(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-1`);
    parts.push(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="response_format"\r\n\r\nverbose_json`);
    parts.push(`\r\n--${boundary}--\r\n`);

    const bodyParts = parts.map(p => typeof p === 'string' ? Buffer.from(p) : p);
    const body = Buffer.concat(bodyParts);

    const url = `${apiBase.replace(/\/$/, '')}/audio/transcriptions`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body,
    });

    if (!res.ok) {
      const t = await res.text().catch(() => '');
      return { error: `Whisper API error ${res.status}: ${t.slice(0, 200)}` };
    }

    const data = await res.json();
    const transcript = data.text || '';
    const duration = data.duration ? `${Math.round(data.duration)}s` : 'unknown';
    const language = data.language || 'unknown';
    const segments = (data.segments || []).map(s => ({
      start: Math.round(s.start * 10) / 10,
      end: Math.round(s.end * 10) / 10,
      text: s.text?.trim(),
    }));

    return {
      ok: true,
      transcript,
      duration,
      language,
      segments: segments.length > 50 ? segments.slice(0, 50) : segments,
      path: realPath,
    };
  } catch (e) {
    return { error: `Whisper API request failed: ${e.message}` };
  } finally {
    if (tempFile) try { unlinkSync(tempFile); } catch (_) {}
  }
}
