import { getConfig, ensureLogDir } from '../config.js';
import { getSystemPrompt } from '../persona.js';
import { chat } from '../brain.js';
import { writeLog, writeCallLog } from '../log.js';

const POLL_INTERVAL = 1500;
const sessions = new Map();

function getSession(chatId) {
  if (!sessions.has(chatId)) sessions.set(chatId, { history: [] });
  return sessions.get(chatId);
}

async function tgApi(token, method, body) {
  const url = `https://api.telegram.org/bot${token}/${method}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function sendMessage(token, chatId, text) {
  const chunks = [];
  for (let i = 0; i < text.length; i += 4000) chunks.push(text.slice(i, i + 4000));
  for (const chunk of chunks) {
    await tgApi(token, 'sendMessage', { chat_id: chatId, text: chunk, parse_mode: 'Markdown' }).catch(() =>
      tgApi(token, 'sendMessage', { chat_id: chatId, text: chunk })
    );
  }
}

async function handleMessage(token, msg, config) {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();
  if (!text) return;

  const userName = msg.from?.first_name || msg.from?.username || 'User';
  const session = getSession(chatId);

  if (text === '/start') {
    await sendMessage(token, chatId, `안녕하세요 ${userName}님! Ultimate Agent입니다. 무엇을 도와드릴까요?\n\n/help — 도움말\n/clear — 대화 초기화\n/goal <목표> — 오토파일럿 목표 모드`);
    return;
  }
  if (text === '/help') {
    await sendMessage(token, chatId, '💬 일반 대화: 아무 메시지\n🎯 /goal <목표> — 오토파일럿 목표 모드\n🗑 /clear — 대화 기록 초기화\n📊 /status — 상태 확인');
    return;
  }
  if (text === '/clear') {
    session.history = [];
    await sendMessage(token, chatId, '대화 기록이 초기화되었습니다.');
    return;
  }
  if (text === '/status') {
    await sendMessage(token, chatId, `✅ Ultimate Agent 작동 중\n대화 기록: ${session.history.length}개\n캐릭터: ${config.character || 'nexus'}\nAPI: ${config.apiBase}`);
    return;
  }

  const isGoal = text.startsWith('/goal ');
  const userMessage = isGoal ? text.slice(6).trim() : text;
  if (!userMessage) return;

  const charId = config.character || 'nexus';
  const systemPrompt = getSystemPrompt(config.home, charId);

  session.history.push({ role: 'user', content: userMessage });
  if (session.history.length > 30) session.history = session.history.slice(-20);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...session.history,
  ];

  const runConfig = isGoal ? { ...config, goalMode: true } : config;
  const toolUses = [];
  const start = Date.now();

  try {
    await tgApi(token, 'sendChatAction', { chat_id: chatId, action: 'typing' });
    const out = await chat(messages, runConfig, (ev) => toolUses.push(ev), null, null);
    const reply = out.content || '(응답 없음)';
    session.history.push({ role: 'assistant', content: reply });

    if (isGoal && out.goalDone) {
      const status = out.goalResult === 'achieved' ? '✅ 목표 달성' : '❌ 목표 불가';
      await sendMessage(token, chatId, `${status}\n\n${out.goalSummary || reply}`);
    } else {
      await sendMessage(token, chatId, reply);
    }

    writeCallLog(config.home, {
      character: charId,
      channel: 'telegram',
      chatId,
      input: userMessage.slice(0, 200),
      outputLen: reply.length,
      toolCalls: toolUses.length,
      durationMs: Date.now() - start,
      outcome: out.goalDone ? 'goal_' + out.goalResult : 'success',
    });
  } catch (e) {
    await sendMessage(token, chatId, `오류가 발생했습니다: ${e.message || String(e)}`);
    writeLog(config.home, 'error', { error: e.message, channel: 'telegram', chatId });
  }
}

export async function runTelegramBot(config) {
  const token = process.env.TELEGRAM_BOT_TOKEN || config.telegramToken;
  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN 환경변수 또는 config.telegramToken을 설정하세요.');
    console.error('BotFather(@BotFather)에서 봇을 만들고 토큰을 받으세요: https://t.me/BotFather');
    process.exit(1);
  }

  ensureLogDir(config.home);

  const me = await tgApi(token, 'getMe', {});
  if (!me.ok) {
    console.error('Telegram 봇 연결 실패:', me.description || 'Invalid token');
    process.exit(1);
  }
  console.log(`\n🤖 Telegram 봇 시작: @${me.result.username} (${me.result.first_name})`);
  console.log('봇에게 메시지를 보내세요. Ctrl+C로 종료.\n');

  let offset = 0;
  while (true) {
    try {
      const updates = await tgApi(token, 'getUpdates', { offset, timeout: 30, allowed_updates: ['message'] });
      if (updates.ok && updates.result?.length) {
        for (const update of updates.result) {
          offset = update.update_id + 1;
          if (update.message) {
            handleMessage(token, update.message, config).catch(e =>
              console.error('Message handler error:', e.message)
            );
          }
        }
      }
    } catch (e) {
      console.error('Telegram polling error:', e.message);
      await new Promise(r => setTimeout(r, 5000));
    }
    await new Promise(r => setTimeout(r, POLL_INTERVAL));
  }
}
