import { existsSync, mkdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join, extname, basename } from 'path';
import { execSync } from 'child_process';
import { homedir, tmpdir } from 'os';

const DOWNLOAD_DIR = join(homedir(), '.ultimate', 'downloads');
const MAX_DIRECT_BYTES = 100 * 1024 * 1024;

const YTDLP_PATH = (() => {
  const candidates = [
    join(homedir(), '.local', 'bin', 'yt-dlp'),
    '/usr/local/bin/yt-dlp',
    '/usr/bin/yt-dlp',
  ];
  for (const p of candidates) if (existsSync(p)) return p;
  try { return execSync('which yt-dlp 2>/dev/null', { encoding: 'utf8' }).trim(); } catch (_) {}
  return null;
})();

function isVideoSite(url) {
  return /youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|tiktok\.com|twitter\.com|x\.com|instagram\.com|twitch\.tv|bilibili\.com|nicovideo\.jp/i.test(url);
}

function directDownload(url, outPath) {
  try {
    execSync(
      `curl -fsSL --max-filesize ${MAX_DIRECT_BYTES} -o "${outPath}" "${url}" 2>/dev/null`,
      { timeout: 60000 }
    );
    return existsSync(outPath) && statSync(outPath).size > 0;
  } catch (_) {
    return false;
  }
}

function ytdlpDownload(url, outDir) {
  if (!YTDLP_PATH) return null;
  const template = join(outDir, '%(title).50s.%(ext)s');
  try {
    const result = execSync(
      `"${YTDLP_PATH}" --no-playlist --max-filesize ${MAX_DIRECT_BYTES} -f "bestvideo[height<=1080]+bestaudio/best[height<=1080]/best" -o "${template}" --print after_move:filepath "${url}" 2>&1`,
      { encoding: 'utf8', timeout: 300000 }
    ).trim();
    const lines = result.split('\n');
    const filePath = lines[lines.length - 1]?.trim();
    if (filePath && existsSync(filePath)) return filePath;
    const files = execSync(`ls -t "${outDir}"`, { encoding: 'utf8' }).trim().split('\n');
    if (files[0]) return join(outDir, files[0]);
    return null;
  } catch (e) {
    return null;
  }
}

function ytdlpInfo(url) {
  if (!YTDLP_PATH) return null;
  try {
    const raw = execSync(
      `"${YTDLP_PATH}" --no-playlist --dump-json "${url}" 2>/dev/null`,
      { encoding: 'utf8', timeout: 30000, maxBuffer: 2 * 1024 * 1024 }
    ).trim();
    const data = JSON.parse(raw);
    return {
      title: data.title || '',
      description: (data.description || '').slice(0, 1000),
      duration: data.duration ? `${Math.round(data.duration)}s` : 'unknown',
      uploader: data.uploader || data.channel || '',
      viewCount: data.view_count,
      uploadDate: data.upload_date || '',
      tags: (data.tags || []).slice(0, 10),
      categories: data.categories || [],
      thumbnail: data.thumbnail || '',
    };
  } catch (_) {
    return null;
  }
}

export async function downloadMedia(url, args = {}, ctx = {}) {
  if (!url || typeof url !== 'string') return { error: 'url is required' };
  if (!/^https?:\/\//i.test(url)) return { error: 'Only http/https URLs are supported' };

  mkdirSync(DOWNLOAD_DIR, { recursive: true });
  const sessionDir = join(DOWNLOAD_DIR, `dl-${Date.now()}`);
  mkdirSync(sessionDir, { recursive: true });

  const useYtdlp = isVideoSite(url) || args.force_ytdlp;
  let filePath = null;
  let metadata = null;

  if (useYtdlp) {
    metadata = ytdlpInfo(url);
    filePath = ytdlpDownload(url, sessionDir);
    if (!filePath) {
      return {
        error: 'yt-dlp download failed. The URL may be restricted, geo-blocked, or invalid.',
        metadata,
        suggestion: 'Try a direct media URL instead, or check if the video is publicly accessible.',
      };
    }
  } else {
    const guessedExt = (url.match(/\.([a-z0-9]{2,5})(?:\?|#|$)/i) || [null, 'bin'])[1];
    const outName = `media-${Date.now()}.${guessedExt}`;
    const outPath = join(sessionDir, outName);
    if (!directDownload(url, outPath)) {
      if (YTDLP_PATH) {
        metadata = ytdlpInfo(url);
        filePath = ytdlpDownload(url, sessionDir);
      }
      if (!filePath) {
        return { error: 'Download failed. The URL may be invalid or the file too large (max 100MB).' };
      }
    } else {
      filePath = outPath;
    }
  }

  const ext = extname(filePath).toLowerCase();
  const fileSize = statSync(filePath).size;
  const fileName = basename(filePath);

  const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.tif'];
  const AUDIO_EXT = ['.mp3', '.m4a', '.wav', '.flac', '.ogg', '.opus', '.aac', '.wma'];
  const VIDEO_EXT = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv', '.m4v', '.3gp'];

  let mediaType = 'unknown';
  if (IMAGE_EXT.includes(ext)) mediaType = 'image';
  else if (AUDIO_EXT.includes(ext)) mediaType = 'audio';
  else if (VIDEO_EXT.includes(ext)) mediaType = 'video';

  return {
    ok: true,
    path: filePath,
    fileName,
    mediaType,
    size: `${Math.round(fileSize / 1024)}KB`,
    format: ext,
    url,
    metadata,
    hint: mediaType === 'video'
      ? 'Use analyze_video to analyze the video content, then use the analysis to replicate it.'
      : mediaType === 'image'
        ? 'Use analyze_image to analyze the image, then replicate it.'
        : mediaType === 'audio'
          ? 'Use transcribe_audio to transcribe the audio, then replicate it.'
          : 'File downloaded. Check the format and use appropriate tools.',
  };
}
