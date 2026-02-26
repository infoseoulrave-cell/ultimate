#!/usr/bin/env node

import * as readline from 'readline';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// 프로젝트 루트로 이동 (어디서 실행해도 동일 동작)
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
if (process.cwd() !== projectRoot) process.chdir(projectRoot);
import { getConfig, ensureLogDir, getConfigForCharacter } from './config.js';
import { getSystemPrompt, getGoalSystemPrompt, getGoalMeetingSystemPrompt } from './persona.js';
import { getCharacter } from './characters.js';
import { chat } from './brain.js';
import { writeLog, writeCallLog, getLogDir, redactToolUses } from './log.js';
import { runInteractiveChat } from './chat-ui.js';
import { runEvolution } from './evolution.js';
import { readFile } from './tools/read-file.js';

const args = process.argv.slice(2);
const cmd = !args[0] ? 'usage' : ['chat', 'logs', 'evolve', 'goal', 'goal-meeting', 'web'].includes(args[0]) ? args[0] : 'usage';
const rest = (cmd === 'chat' || cmd === 'goal') ? args.slice(1) : [];

function printUsage() {
  console.error('Usage: ultimate chat \"message\"');
  console.error('       ultimate chat -c <name> \"message\"    # character: nexus, seri, turnbo');
  console.error('       ultimate chat -f <path> \"message\"   # attach file (allowlist)');
  console.error('       ultimate chat          # interactive TUI');
  console.error('       ultimate goal \"목표\"   # 목표 달성까지 도구로 반복 실행 (핵심 기능)');
  console.error('       ultimate goal -c seri \"목표\"        # 캐릭터 지정');
  console.error('       # config에 goalMeetingParticipants: [\"seri\", \"turnbo\"] 있으면 둘이 회의하며 개발');
  console.error('       ultimate goal-meeting  # 대화형 그룹 목표 모드 (목표 입력 → 둘이 회의 → 반복)');
  console.error('       ultimate evolve        # self-meeting (NEXUS vs OBSERVER)');
  console.error("       ultimate logs          # show log dir and today's calls");
  console.error('       ultimate web           # 웹 UI 띄우기 (http://localhost:3000/chat)');
  console.error('Quick start: README § 실행 방법 or docs/ARCHITECTURE.md');
}

async function main() {
  const config = getConfig();
  ensureLogDir(config.home);

  if (cmd === 'usage') {
    printUsage();
    process.exit(0);
  }

  if (cmd === 'web') {
    console.log('🌐 Web UI 모드 시작... (Tailwind CSS 적용)');
    const { startWebServer } = await import('./web-server.js');
    startWebServer(config);
    return;
  }

  if (cmd === 'evolve') {
    console.log('Running self-meeting (NEXUS vs OBSERVER)...');
    const out = await runEvolution(config);
    console.log(out);
    console.log('\nEvolution log and patch updated in', config.home);
    return;
  }

  if (cmd === 'goal-meeting') {
    if (!config.goalMeetingParticipants || config.goalMeetingParticipants.length !== 2) {
      console.error('goal-meeting requires goalMeetingParticipants with exactly 2 characters in config (e.g. [\\\"seri\\\", \\\"turnbo\\\"]).');
      process.exit(1);
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const participants = config.goalMeetingParticipants;
    const names = participants.map((id) => getCharacter(id).name.split(' ')[0]).join(' & ');
    console.log('\n\x1b[33m그룹 목표 모드 — ' + names + '\x1b[0m');
    console.log('\x1b[2m목표를 입력하면 둘이 회의하며 개발합니다. /quit 종료.\x1b[0m\n');
    function prompt() {
      rl.question('\x1b[32m목표> \x1b[0m', async (line) => {
        const goal = (line || '').trim();
        if (!goal || /^\/(quit|exit|q)$/i.test(goal)) {
          console.log('\x1b[2mBye.\x1b[0m');
          rl.close();
          process.exit(0);
        }
        await runGoalMeeting(goal, config);
        console.log('');
        prompt();
      });
    }
    prompt();
    return;
  }

  if (cmd === 'logs') {
    const dir = getLogDir(config.home);
    console.log('Logs directory:', dir);
    const date = new Date().toISOString().slice(0, 10);
    const callsPath = join(dir, `calls-${date}.log`);
    if (existsSync(callsPath)) {
      const lines = readFileSync(callsPath, 'utf8').trim().split('\n').filter(Boolean);
      let totalMs = 0;
      let successCount = 0;
      const byChar = {};
      for (const l of lines) {
        const parts = l.split('\t');
        if (parts[2]) {
          try {
            const o = JSON.parse(parts[2]);
            if (typeof o.durationMs === 'number') totalMs += o.durationMs;
            if (o.outcome === 'success') successCount++;
            const c = o.character || 'nexus';
            byChar[c] = (byChar[c] || 0) + 1;
          } catch (_) {}
        }
      }
      const avg = lines.length ? Math.round(totalMs / lines.length / 1000 * 10) / 10 : 0;
      console.log(`Today's calls: ${lines.length} (${successCount} ok), avg ${avg}s`);
      const charLine = Object.entries(byChar).map(([k, n]) => `${k} ${n}`).join(', ');
      if (charLine) console.log('  by character: ' + charLine);
      for (const l of lines.slice(-5)) console.log('  ', l.slice(0, 120) + (l.length > 120 ? '...' : ''));
    } else {
      console.log('Session log: session-YYYY-MM-DD.log');
      console.log('Call log (KPI): calls-YYYY-MM-DD.log');
    }
    return;
  }

  const MAX_ATTACH_CHARS = 8000;
  let charId = config.character;
  let filePath = null;
  let msgParts = [];
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '-c' || rest[i] === '--character') {
      charId = rest[i + 1] || charId;
      i++;
      continue;
    }
    if (rest[i] === '-f' || rest[i] === '--file') {
      filePath = rest[i + 1];
      i++;
      continue;
    }
    msgParts = rest.slice(i);
    break;
  }
  let userMessage = msgParts.join(' ').trim();
  if (filePath) {
    const r = await readFile(filePath, { allowDirs: config.allowDirs });
    if (r.error) userMessage = `[Attachment failed: ${r.error}]\n\n${userMessage || '이 파일을 확인해줘'}`;
    else userMessage = `[Attached file: ${filePath}]\n\n${(r.content || '').slice(0, MAX_ATTACH_CHARS)}${(r.content || '').length > MAX_ATTACH_CHARS ? '\n...[truncated]' : ''}\n\nUser: ${userMessage || '이 파일을 읽고 요약해줘'}`;
  }
  if (!userMessage) {
    if (cmd === 'goal') {
      console.error('No goal provided. Usage: ultimate goal \"목표\"');
      process.exit(1);
    }
    if (!process.stdin.isTTY) {
      console.error('대화창은 터미널에서만 사용할 수 있습니다.');
      console.error('Cursor 터미널 탭 또는 macOS 터미널을 열고 다음을 실행하세요:');
      console.error('  cd /Users/minho/ultimate && node src/entry.js chat');
      process.exit(1);
    }
    await runInteractiveChat();
    return;
  }
  if (!userMessage) {
    console.error('No message provided.');
    process.exit(1);
  }

  const isGoal = cmd === 'goal';
  const goalMeeting = isGoal && config.goalMeetingParticipants?.length === 2;

  if (goalMeeting) {
    await runGoalMeeting(userMessage, config);
    return;
  }

  const messages = isGoal
    ? [
        { role: 'system', content: getGoalSystemPrompt(config.home, charId, userMessage, process.cwd()) },
        { role: 'user', content: '이 목표를 달성할 때까지 단계별로 진행해줘. 실패하면 다른 방법을 시도해. 절대 멈추지 마.' },
      ]
    : [
        { role: 'system', content: getSystemPrompt(config.home, charId) },
        { role: 'user', content: userMessage },
      ];

  const toolUses = [];
  const start = Date.now();
  let content;
  let err;
  let goalDone;
  let goalResult;
  let goalSummary;
  const runConfig = isGoal ? { ...config, goalMode: true } : config;
  const outColor = config.ui?.assistantColor ?? '\x1b[34m';
  const onChunk = (chunk) => process.stdout.write(outColor + chunk + '\x1b[0m');

  const MAX_GOAL_CONTINUATIONS = 3;
  let continuations = 0;
  let currentMessages = [...messages];

  while (true) {
    try {
      const out = await chat(currentMessages, runConfig, (ev) => toolUses.push(ev), onChunk);
      content = out.content;
      goalDone = out.goalDone;
      goalResult = out.goalResult;
      goalSummary = out.goalSummary;
      if (content && onChunk) process.stdout.write('\n');

      if (goalDone || !isGoal) break;

      if (out.finishReason === 'length' && continuations < MAX_GOAL_CONTINUATIONS) {
        continuations++;
        console.log('\n\x1b[33m[라운드 한도 도달 — 자동 연장 ' + continuations + '/' + MAX_GOAL_CONTINUATIONS + ']\x1b[0m');
        currentMessages = [
          ...currentMessages,
          { role: 'assistant', content: content || '진행 중입니다...' },
          { role: 'user', content: '아직 목표가 완료되지 않았어. 멈추지 말고 계속 진행해. 다른 방법을 시도해서라도 반드시 달성해.' },
        ];
        continue;
      }
      break;
    } catch (e) {
      err = e.message || String(e);
      writeLog(config.home, 'error', { error: err, input: userMessage });
      console.error(err);
      process.exit(1);
    }
  }

  const duration = Date.now() - start;
  writeCallLog(config.home, {
    character: charId,
    goal: isGoal,
    goalResult: goalDone ? goalResult : undefined,
    input: userMessage.slice(0, 200),
    outputLen: content?.length ?? 0,
    toolCalls: toolUses.length,
    durationMs: duration,
    error: err || null,
    outcome: goalDone ? (goalResult === 'achieved' ? 'goal_achieved' : 'goal_impossible') : (err ? 'failure' : (content?.length ? 'success' : 'partial')),
  });
  if (toolUses.length) writeLog(config.home, 'tools', redactToolUses(toolUses));

  if (goalDone) {
    console.log('\n\x1b[32m[목표 ' + (goalResult === 'achieved' ? '달성' : '불가') + ']\x1b[0m ' + (goalSummary || ''));
  } else if (content && !onChunk) {
    console.log(outColor + content + '\x1b[0m');
  } else if (isGoal && !content) {
    console.log('\n\x1b[33m(최대 연장 한도 도달. 목표는 아직 완료되지 않았습니다.)\x1b[0m');
  }
}

function buildGoalMeetingMessages(history, speakerId, goalText, home, participants) {
  const otherId = participants.find((id) => id !== speakerId);
  const otherName = otherId ? getCharacter(otherId).name : '상대';
  const system = getGoalMeetingSystemPrompt(home, speakerId, goalText, otherName, process.cwd());
  const messages = [{ role: 'system', content: system }];
  let i = 0;
  while (i < history.length) {
    const entry = history[i];
    if (entry.role === 'user') {
      messages.push({ role: 'user', content: entry.content });
      i++;
      continue;
    }
    const block = [];
    while (i < history.length && history[i].role === 'assistant') {
      const a = history[i];
      const name = getCharacter(a.characterId).name.split(' ')[0];
      block.push(name + ': ' + (a.content || '').trim());
      i++;
    }
    if (block.length) messages.push({ role: 'assistant', content: block.join('\n\n') });
  }
  return messages;
}

async function runGoalMeeting(goalText, config) {
  const participants = config.goalMeetingParticipants;
  const [aId, bId] = participants;
  const aName = getCharacter(aId).name.split(' ')[0];
  const bName = getCharacter(bId).name.split(' ')[0];
  const outColor = config.ui?.assistantColor ?? '\x1b[34m';
  const userContent = '목표: ' + goalText.trim() + '\n\n둘이서 회의하면서 이 목표를 개발해 나가줘. 필요하면 도구를 쓰고, 달성되면 finish_goal을 호출해줘.';
  const history = [{ role: 'user', content: userContent }];
  const maxRounds = config.maxGoalRounds ?? 24;
  const start = Date.now();
  let totalToolUses = 0;

  console.log('\n\x1b[33m[목표 회의] ' + aName + ' & ' + bName + '\x1b[0m\n');
  console.log(outColor + '목표: ' + goalText.trim() + '\x1b[0m\n');

  for (let round = 0; round < maxRounds; round++) {
    const speakerId = participants[round % 2];
    const label = getCharacter(speakerId).name.split(' ')[0] + '> ';
    const speakerLabel = getCharacter(speakerId).name.split(' ')[0] + ': ';
    process.stdout.write(outColor + label + '...' + '\x1b[0m');
    const toolUses = [];
    let firstChunk = true;
    const stripAssistantPrefix = (text) => {
      let s = text.trimStart();
      const prefixes = [speakerLabel, 'Assistant: ', '**' + getCharacter(speakerId).name.split(' ')[0] + '**: ', getCharacter(speakerId).name.split(' ')[0] + ': '];
      for (const p of prefixes) {
        if (s.startsWith(p)) { s = s.slice(p.length).trimStart(); break; }
      }
      if (s.startsWith(speakerLabel)) s = s.slice(speakerLabel.length).trimStart();
      return s;
    };
    const onChunk = (chunk) => {
      if (firstChunk) {
        chunk = stripAssistantPrefix(chunk);
        process.stdout.write('\r\x1b[K' + outColor + label + chunk + '\x1b[0m');
        firstChunk = false;
      } else process.stdout.write(outColor + chunk + '\x1b[0m');
    };
    const onToolRoundStart = (names) => {
      process.stdout.write('\r\x1b[K' + outColor + label + '도구 실행 중... (' + (names || []).join(', ') + ')' + '\x1b[0m');
    };
    try {
      const charConfig = {
        ...getConfigForCharacter(config, speakerId),
        goalMode: true,
        maxGoalRounds: Math.max(config.maxGoalRounds ?? 20, 30),
      };
      const messages = buildGoalMeetingMessages(history, speakerId, goalText, config.home, participants);
      const out = await chat(messages, charConfig, (ev) => toolUses.push(ev), onChunk, onToolRoundStart);
      process.stdout.write('\n');
      if (out.goalDone) {
        console.log('\n\x1b[32m[목표 ' + (out.goalResult === 'achieved' ? '달성' : '불가') + ']\x1b[0m ' + (out.goalSummary || ''));
        writeCallLog(config.home, {
          character: 'goal_meeting',
          goal: true,
          goalResult: out.goalResult,
          input: goalText.slice(0, 200),
          outputLen: history.length,
          toolCalls: totalToolUses + toolUses.length,
          durationMs: Date.now() - start,
          outcome: out.goalResult === 'achieved' ? 'goal_achieved' : 'goal_impossible',
        });
        return;
      }
      const content = out.content || '';
      history.push({ role: 'assistant', content, characterId: speakerId });
      totalToolUses += toolUses.length;
      if (toolUses.length) writeLog(config.home, 'tools', redactToolUses(toolUses));
    } catch (e) {
      process.stdout.write('\n');
      console.error(outColor + label + '\x1b[0m\x1b[31m[오류] ' + (e.message || String(e)) + '\x1b[0m');
      writeLog(config.home, 'error', { error: e.message, goal: goalText.slice(0, 100), character: speakerId });
      writeCallLog(config.home, { character: 'goal_meeting', input: goalText.slice(0, 200), outcome: 'failure', error: e.message });
      return;
    }
  }
  console.log('\n\x1b[33m(회의 한도 도달. 목표는 아직 완료되지 않았습니다.)\x1b[0m');
  writeCallLog(config.home, { character: 'goal_meeting', goal: true, input: goalText.slice(0, 200), outcome: 'partial', durationMs: Date.now() - start });
}

main().catch((err) => {
  console.error('Error:', err.message || err);
  process.exit(1);
});
