import { getConfig, ensureLogDir } from '../config.js';
import { getSystemPrompt } from '../persona.js';
import { chat } from '../brain.js';
import { writeLog, writeCallLog } from '../log.js';

const GATEWAY_URL = 'wss://gateway.discord.gg/?v=10&encoding=json';
const sessions = new Map();

function getSession(channelId) {
  if (!sessions.has(channelId)) sessions.set(channelId, { history: [] });
  return sessions.get(channelId);
}

async function discordApi(token, method, path, body) {
  const url = `https://discord.com/api/v10${path}`;
  const opts = {
    method,
    headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  return res.json();
}

async function sendReply(token, channelId, text) {
  const chunks = [];
  for (let i = 0; i < text.length; i += 1900) chunks.push(text.slice(i, i + 1900));
  for (const chunk of chunks) {
    await discordApi(token, 'POST', `/channels/${channelId}/messages`, { content: chunk });
  }
}

async function handleDiscordMessage(token, msg, config, botId) {
  if (msg.author?.id === botId) return;
  if (msg.author?.bot) return;
  const text = msg.content?.trim();
  if (!text) return;

  const channelId = msg.channel_id;
  const userName = msg.author?.username || 'User';
  const session = getSession(channelId);

  if (text === '!help') {
    await sendReply(token, channelId, '💬 일반 대화: 아무 메시지\n🎯 `!goal <목표>` — 오토파일럿 목표 모드\n🗑 `!clear` — 대화 기록 초기화');
    return;
  }
  if (text === '!clear') {
    session.history = [];
    await sendReply(token, channelId, '대화 기록이 초기화되었습니다.');
    return;
  }

  const isGoal = text.startsWith('!goal ');
  const userMessage = isGoal ? text.slice(6).trim() : text;
  if (!userMessage) return;

  const charId = config.character || 'nexus';
  session.history.push({ role: 'user', content: userMessage });
  if (session.history.length > 30) session.history = session.history.slice(-20);

  const messages = [
    { role: 'system', content: getSystemPrompt(config.home, charId) },
    ...session.history,
  ];

  const runConfig = isGoal ? { ...config, goalMode: true } : config;
  const start = Date.now();

  try {
    await discordApi(token, 'POST', `/channels/${channelId}/typing`, {});
    const out = await chat(messages, runConfig, null, null, null);
    const reply = out.content || '(응답 없음)';
    session.history.push({ role: 'assistant', content: reply });
    await sendReply(token, channelId, reply);

    writeCallLog(config.home, {
      character: charId, channel: 'discord', channelId,
      input: userMessage.slice(0, 200), outputLen: reply.length,
      durationMs: Date.now() - start, outcome: 'success',
    });
  } catch (e) {
    await sendReply(token, channelId, `오류: ${e.message}`);
    writeLog(config.home, 'error', { error: e.message, channel: 'discord' });
  }
}

export async function runDiscordBot(config) {
  const token = process.env.DISCORD_BOT_TOKEN || config.discordToken;
  if (!token) {
    console.error('DISCORD_BOT_TOKEN 환경변수 또는 config.discordToken을 설정하세요.');
    console.error('https://discord.com/developers/applications 에서 봇을 만드세요.');
    process.exit(1);
  }

  ensureLogDir(config.home);

  const me = await discordApi(token, 'GET', '/users/@me');
  if (!me.id) {
    console.error('Discord 봇 연결 실패:', me.message || 'Invalid token');
    process.exit(1);
  }
  const botId = me.id;
  console.log(`\n🎮 Discord 봇 시작: ${me.username}#${me.discriminator}`);
  console.log('서버에 봇을 초대하고 메시지를 보내세요. Ctrl+C로 종료.\n');

  const { default: WebSocket } = await import('ws').catch(() => {
    console.error('ws 패키지가 필요합니다. npm install ws 를 실행하세요.');
    process.exit(1);
  });

  let heartbeatInterval = null;
  let seq = null;

  function connect() {
    const ws = new WebSocket(GATEWAY_URL);

    ws.on('message', async (data) => {
      const payload = JSON.parse(data.toString());
      const { op, d, s, t } = payload;
      if (s) seq = s;

      if (op === 10) {
        heartbeatInterval = setInterval(() => ws.send(JSON.stringify({ op: 1, d: seq })), d.heartbeat_interval);
        ws.send(JSON.stringify({
          op: 2,
          d: { token, intents: 512 | 32768, properties: { os: 'linux', browser: 'ultimate', device: 'ultimate' } },
        }));
      }
      if (op === 11) {}
      if (t === 'MESSAGE_CREATE') {
        handleDiscordMessage(token, d, config, botId).catch(e => console.error('Discord handler error:', e.message));
      }
    });

    ws.on('close', () => {
      clearInterval(heartbeatInterval);
      console.log('Discord WebSocket closed. Reconnecting in 5s...');
      setTimeout(connect, 5000);
    });
    ws.on('error', (e) => console.error('Discord WS error:', e.message));
  }

  connect();
}
