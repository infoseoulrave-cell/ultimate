import { spawn } from 'child_process';
import { runOpenClaw } from './run-openclaw.js';
import { readFile } from './read-file.js';
import { writeFile } from './write-file.js';
import { fetchUrl } from './fetch-url.js';
import { saveKnowledge, readKnowledge } from './knowledge.js';
import { runCommand } from './run-command.js';
import { analyzeImage } from './analyze-image.js';
import { transcribeAudio } from './transcribe-audio.js';
import { analyzeVideo } from './analyze-video.js';
import { downloadMedia } from './download-media.js';
import { replicateReference } from './replicate-reference.js';

const TOOL_LIST = [
  {
    type: 'function',
    function: {
      name: 'run_openclaw',
      description: 'Run the local OpenClaw agent with a message. Use when the user wants to delegate to OpenClaw (e.g. send to channels, use OpenClaw skills).',
      parameters: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'Message or task to send to OpenClaw agent' },
        },
        required: ['message'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read contents of a file. Only paths under allowed directories (e.g. current workspace, ~/.ultimate) are permitted.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Absolute or relative path to the file' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Write content to a file. Only paths under allowed directories are permitted. Creates parent directories if needed.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Absolute or relative path to the file' },
          content: { type: 'string', description: 'Content to write (UTF-8)' },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'fetch_url',
      description: 'Fetch a public URL and return its text content (HTML is stripped to plain text). Use to browse the internet and gather information. Only http/https URLs; no file:// or localhost.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Full URL to fetch (e.g. https://example.com/page)' },
        },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'save_knowledge',
      description: 'Save something you learned to the local knowledge store (url, title, summary, tags). Use after fetching or reading useful content so you can recall it later. tags help search (e.g. ["javascript", "api"]).',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Source URL if from the web' },
          title: { type: 'string', description: 'Short title for this knowledge' },
          summary: { type: 'string', description: 'Summary or key points to remember' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Optional keywords (3–5) for easier search' },
        },
        required: ['title', 'summary'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_knowledge',
      description: 'Search or list entries in the local knowledge store (things you previously saved with save_knowledge). Optional query to filter by keyword.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Optional keyword to search in title/summary/url' },
          limit: { type: 'number', description: 'Max entries to return (default 20, max 50)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_command',
      description: 'Execute a shell command on the local machine and return stdout/stderr. Use this to install packages, run scripts, compile code, manage processes, check system state, or any task that requires terminal access. Destructive system-level commands (e.g. rm -rf /) are blocked.',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Shell command to execute (e.g. "ls -la", "npm install", "python3 script.py")' },
          cwd: { type: 'string', description: 'Optional working directory (defaults to project root)' },
          timeout_seconds: { type: 'number', description: 'Max seconds to wait (default 30, max 120)' },
        },
        required: ['command'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_image',
      description: 'Analyze an image file using vision AI. Returns a detailed description of the image content including objects, text, colors, layout, people, and scene. Use this when you need to understand what is in a photo, screenshot, diagram, or any image file.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to the image file (jpg, png, gif, webp, bmp, tiff)' },
          question: { type: 'string', description: 'Optional specific question about the image (default: general analysis)' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'transcribe_audio',
      description: 'Transcribe an audio file to text using Whisper AI. Returns the full transcript with timestamps, detected language, and duration. Use this when you need to understand what is said in an audio recording, podcast, voice memo, or music file.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to the audio file (mp3, wav, m4a, flac, ogg, opus, webm, aac, wma)' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_video',
      description: 'Analyze a video file by extracting key frames (visual analysis) and audio (transcription). Returns frame-by-frame visual descriptions plus audio transcript. Use this when you need to understand the content of a video file.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to the video file (mp4, mov, avi, mkv, webm, flv, wmv)' },
          question: { type: 'string', description: 'Optional specific question about the video (default: general analysis)' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'download_media',
      description: 'Download a media file (video, image, audio) from a URL to local storage. Supports YouTube, Vimeo, TikTok, Twitter/X, Instagram, and direct media URLs. Uses yt-dlp for video sites. Returns the local file path and metadata. After downloading, use analyze_image/analyze_video/transcribe_audio to analyze the content.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL of the media to download (YouTube link, direct .mp4/.jpg URL, etc.)' },
        },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'replicate_reference',
      description: 'Download a reference media (video/image/audio) from URL, analyze it in detail, and generate a step-by-step replication plan. Use this when the user provides a reference URL and wants you to create something identical or similar. The tool downloads the media, analyzes every visual/audio detail (layout, colors, fonts, animations, text, timing), and returns a structured plan to reproduce it.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL of the reference media (YouTube video, image URL, etc.)' },
          instruction: { type: 'string', description: 'Optional specific instruction about what aspect to focus on or how to replicate' },
        },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'restart_self',
      description: 'Restart the current Ultimate session (exit this process and start a new one in the same terminal). Use ONLY when the user explicitly asks to restart, relaunch, or "끄고 다시 실행해" the app. After a short delay the session will restart; the user does not need to press Ctrl+C.',
      parameters: {
        type: 'object',
        properties: {
          delay_seconds: { type: 'number', description: 'Optional seconds to wait before restart (default 1.5, max 5)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'finish_goal',
      description: 'Call ONLY when the given goal is achieved or you have determined it is impossible. Do not call until then. result: "achieved" when done, "impossible" when it cannot be done. summary: short outcome in 1–2 sentences.',
      parameters: {
        type: 'object',
        properties: {
          result: { type: 'string', enum: ['achieved', 'impossible'], description: 'achieved = goal done; impossible = cannot be completed' },
          summary: { type: 'string', description: 'Short summary of what was done or why impossible' },
        },
        required: ['result', 'summary'],
      },
    },
  },
];

export const TOOL_DEFINITIONS = TOOL_LIST.slice(0, -1);
export const TOOL_DEFINITIONS_GOAL = TOOL_LIST;

const RESTART_PATTERNS = [
  /restart/i, /재시작|다시\s*켜|끄고\s*다시|다시\s*실행|재실행|다시\s*띄워|재기동/i,
  /relaunch|reboot\s*(the\s*)?app|restart\s*(the\s*)?(app|session|ultimate)/i,
];

function lastUserAskedRestart(lastUserContent) {
  const s = String(lastUserContent || '').trim();
  if (s.length < 2) return false;
  return RESTART_PATTERNS.some((re) => re.test(s));
}

export async function runTool(name, args, ctx) {
  if (name === 'restart_self') {
    if (!lastUserAskedRestart(ctx?.lastUserContent)) {
      return { error: 'restart_self requires explicit user request (e.g. "재시작해줘", "끄고 다시 실행해").' };
    }
    const delayMs = Math.min((Number(args?.delay_seconds) || 1.5), 5) * 1000;
    setTimeout(() => {
      const child = spawn(process.execPath, process.argv.slice(1), {
        detached: true,
        stdio: 'inherit',
        cwd: process.cwd(),
        env: process.env,
      });
      child.unref();
      process.exit(0);
    }, delayMs);
    return new Promise(() => {}); // never resolve; process exits
  }
  if (name === 'finish_goal') {
    const result = args?.result === 'impossible' ? 'impossible' : 'achieved';
    return { _goalFinished: true, result, summary: String(args?.summary ?? '').slice(0, 500) };
  }
  if (name === 'run_command') return runCommand(args.command, args, ctx);
  if (name === 'analyze_image') return analyzeImage(args.path, args.question, { ...ctx, apiKey: ctx._apiKey, apiBase: ctx._apiBase, model: ctx._model });
  if (name === 'transcribe_audio') return transcribeAudio(args.path, { ...ctx, apiKey: ctx._apiKey, apiBase: ctx._apiBase });
  if (name === 'analyze_video') return analyzeVideo(args.path, args.question, { ...ctx, apiKey: ctx._apiKey, apiBase: ctx._apiBase, model: ctx._model });
  if (name === 'download_media') return downloadMedia(args.url, args, ctx);
  if (name === 'replicate_reference') return replicateReference(args.url, args.instruction, ctx);
  if (name === 'run_openclaw') return runOpenClaw(args.message, ctx);
  if (name === 'read_file') return readFile(args.path, ctx);
  if (name === 'write_file') return writeFile(args.path, args.content, ctx);
  if (name === 'fetch_url') return fetchUrl(args.url, ctx);
  if (name === 'save_knowledge') return saveKnowledge(args, ctx);
  if (name === 'read_knowledge') return readKnowledge(args, ctx);
  return { error: `Unknown tool: ${name}` };
}
