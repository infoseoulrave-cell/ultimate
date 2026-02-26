import { existsSync, realpathSync, mkdirSync, readFileSync, readdirSync, unlinkSync, rmdirSync } from 'fs';
import { resolve, extname, join } from 'path';
import { execSync } from 'child_process';
import { tmpdir } from 'os';
import { analyzeImage } from './analyze-image.js';
import { transcribeAudio } from './transcribe-audio.js';

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv', '.m4v', '.3gp'];
const MAX_FRAMES = 6;

function isAllowed(absPath, allowDirs) {
  const norm = (p) => { const r = resolve(p); return r.startsWith('/private/') ? r.slice('/private'.length) : r; };
  const n = norm(absPath);
  for (const d of allowDirs || []) {
    const nd = norm(d);
    if (n === nd || n.startsWith(nd + '/')) return true;
  }
  return false;
}

function getVideoDuration(videoPath) {
  try {
    const out = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}" 2>/dev/null`,
      { encoding: 'utf8', timeout: 15000 }
    ).trim();
    return parseFloat(out) || 0;
  } catch (_) {
    return 0;
  }
}

function extractFrames(videoPath, outputDir, numFrames) {
  const duration = getVideoDuration(videoPath);
  if (duration <= 0) {
    try {
      execSync(`ffmpeg -y -i "${videoPath}" -vframes 1 "${join(outputDir, 'frame_001.jpg')}" 2>/dev/null`, { timeout: 30000 });
    } catch (_) {}
    return;
  }
  const interval = duration / (numFrames + 1);
  for (let i = 1; i <= numFrames; i++) {
    const time = Math.min(interval * i, duration - 0.1);
    const idx = String(i).padStart(3, '0');
    try {
      execSync(
        `ffmpeg -y -ss ${time.toFixed(2)} -i "${videoPath}" -vframes 1 -q:v 2 "${join(outputDir, `frame_${idx}.jpg`)}" 2>/dev/null`,
        { timeout: 15000 }
      );
    } catch (_) {}
  }
}

function extractAudio(videoPath, outputPath) {
  try {
    execSync(
      `ffmpeg -y -i "${videoPath}" -vn -ar 16000 -ac 1 -b:a 64k "${outputPath}" 2>/dev/null`,
      { timeout: 60000 }
    );
    return existsSync(outputPath);
  } catch (_) {
    return false;
  }
}

function cleanupDir(dir) {
  try {
    for (const f of readdirSync(dir)) unlinkSync(join(dir, f));
    rmdirSync(dir);
  } catch (_) {}
}

export async function analyzeVideo(pathArg, question, ctx) {
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
  if (!VIDEO_EXTENSIONS.includes(ext)) return { error: `Not a supported video format (${ext}). Supported: ${VIDEO_EXTENSIONS.join(', ')}` };

  const workDir = join(tmpdir(), `ultimate-video-${Date.now()}`);
  mkdirSync(workDir, { recursive: true });

  try {
    const duration = getVideoDuration(realPath);
    const durationStr = duration > 0 ? `${Math.round(duration)}s` : 'unknown';

    extractFrames(realPath, workDir, MAX_FRAMES);
    const frames = readdirSync(workDir).filter(f => f.startsWith('frame_')).sort();

    const frameAnalyses = [];
    const framePrompt = question
      ? `이것은 동영상의 한 프레임이다. 다음 질문에 대해 이 프레임에서 관련 정보를 찾아서 답해줘: ${question}`
      : '이것은 동영상의 한 프레임이다. 이 프레임에서 보이는 내용(장면, 인물, 텍스트, 동작, 환경)을 간결하게 설명해줘.';

    for (const frame of frames) {
      const framePath = join(workDir, frame);
      const frameCtx = { ...ctx, allowDirs: [...(ctx?.allowDirs || []), workDir] };
      const result = await analyzeImage(framePath, framePrompt, frameCtx);
      if (result.ok) {
        frameAnalyses.push({ frame, analysis: result.analysis });
      }
    }

    let audioTranscript = null;
    const audioPath = join(workDir, 'audio.mp3');
    if (extractAudio(realPath, audioPath)) {
      const audioCtx = { ...ctx, allowDirs: [...(ctx?.allowDirs || []), workDir] };
      const audioResult = await transcribeAudio(audioPath, audioCtx);
      if (audioResult.ok) {
        audioTranscript = {
          text: audioResult.transcript,
          language: audioResult.language,
          duration: audioResult.duration,
        };
      }
    }

    return {
      ok: true,
      path: realPath,
      duration: durationStr,
      framesAnalyzed: frameAnalyses.length,
      frames: frameAnalyses.map((f, i) => ({
        index: i + 1,
        analysis: f.analysis,
      })),
      audio: audioTranscript,
      format: ext,
    };
  } catch (e) {
    return { error: `Video analysis failed: ${e.message}` };
  } finally {
    cleanupDir(workDir);
  }
}
