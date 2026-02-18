import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const DEFAULT_HOME = join(homedir(), '.ultimate');
const CONFIG_FILE = 'config.json';

function loadConfig() {
  const home = process.env.ULTIMATE_HOME || DEFAULT_HOME;
  const configPath = join(home, CONFIG_FILE);
  let data = {};
  if (existsSync(configPath)) {
    try {
      const raw = readFileSync(configPath, 'utf8');
      data = JSON.parse(raw);
    } catch (_) {
      // ignore parse error
    }
  }
  const useXai = process.env.XAI_API_KEY || data.apiKey?.startsWith?.('xai-');
  const useGroq = !useXai && (process.env.GROQ_API_KEY || data.apiKey?.startsWith?.('gsk_'));
  const apiKey = process.env.XAI_API_KEY || process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || process.env.ULTIMATE_API_KEY || data.apiKey || '';
  const apiBase = useXai
    ? (process.env.XAI_API_BASE || data.apiBase || 'https://api.x.ai/v1')
    : useGroq
      ? (process.env.GROQ_API_BASE || data.apiBase || 'https://api.groq.com/openai/v1')
      : (process.env.OPENAI_API_BASE || process.env.ULTIMATE_API_BASE || data.apiBase || 'https://api.openai.com/v1');
  const model = useXai
    ? (process.env.ULTIMATE_MODEL || data.model || 'grok-4-1-fast-reasoning')
    : useGroq
      ? (process.env.ULTIMATE_MODEL || data.model || 'llama-3.3-70b-versatile')
      : (process.env.ULTIMATE_MODEL || data.model || 'gpt-4o-mini');
  const character = (process.env.ULTIMATE_CHARACTER || data.character || 'nexus').toLowerCase();
  const groupParticipants = Array.isArray(data.groupParticipants) ? data.groupParticipants : null;
  const goalMeetingParticipants = Array.isArray(data.goalMeetingParticipants) && data.goalMeetingParticipants.length === 2
    ? data.goalMeetingParticipants
    : null;
  const characterApi = data.characters && typeof data.characters === 'object' ? data.characters : {};
  const rawUi = (data.ui?.theme ?? data.ui?.color ?? 'blue').toString().trim();
  const uiTheme = rawUi.toLowerCase();
  const assistantColor = uiTheme.startsWith('#')
    ? (() => {
        const hex = uiTheme.replace(/^#/, '');
        if (hex.length !== 6) return '\x1b[34m';
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return `\x1b[38;2;${r};${g};${b}m`;
      })()
    : { yellow: '\x1b[93m', green: '\x1b[32m', blue: '\x1b[34m', cyan: '\x1b[36m', magenta: '\x1b[35m' }[uiTheme] || '\x1b[34m';
  return {
    home,
    apiKey,
    apiBase,
    model,
    character,
    groupParticipants,
    goalMeetingParticipants,
    characterApi,
    ui: { theme: uiTheme, assistantColor },
    openclawPath: process.env.OPENCLAW_PATH || data.openclawPath || 'openclaw',
    allowDirs: Array.isArray(data.allowDirs) ? data.allowDirs : [process.cwd(), home, join(homedir(), '.openclaw')],
    maxToolRounds: Math.min(Number(process.env.ULTIMATE_MAX_TOOL_ROUNDS) || data.maxToolRounds || 5, 10),
    maxGoalRounds: Math.min(Number(process.env.ULTIMATE_MAX_GOAL_ROUNDS) || data.maxGoalRounds || 20, 30),
    fetchTimeout: Number(process.env.ULTIMATE_FETCH_TIMEOUT) || data.fetchTimeout || 15000,
    maxFetchBytes: Number(process.env.ULTIMATE_MAX_FETCH_BYTES) || data.maxFetchBytes || 500 * 1024,
    openclawTimeout: Number(process.env.ULTIMATE_OPENCLAW_TIMEOUT) || data.openclawTimeout || 60000,
    evolutionMaxPatchChars: Number(process.env.ULTIMATE_EVOLUTION_MAX_PATCH_CHARS) || data.evolutionMaxPatchChars || 2000,
  };
}

export function ensureLogDir(home) {
  const logDir = join(home || DEFAULT_HOME, 'logs');
  if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true });
  return logDir;
}

/** Config for one character (e.g. 세리=OpenAI). Use when groupParticipants is set. */
export function getConfigForCharacter(config, charId) {
  const over = config.characterApi?.[charId];
  if (!over || (!over.apiKey && !over.apiBase && !over.model)) return config;
  const key = over.apiKey && !String(over.apiKey).startsWith('YOUR_') ? over.apiKey : config.apiKey;
  return {
    ...config,
    apiKey: key,
    apiBase: over.apiBase ?? config.apiBase,
    model: over.model ?? config.model,
  };
}

export const getConfig = loadConfig;
