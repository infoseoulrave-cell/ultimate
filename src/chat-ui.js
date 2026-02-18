import * as readline from 'readline';
import { getConfig, ensureLogDir, getConfigForCharacter } from './config.js';
import { getSystemPrompt } from './persona.js';
import { getCharacter } from './characters.js';
import { chat } from './brain.js';
import { writeLog, writeCallLog, getLogDir, redactToolUses } from './log.js';
import { readFile } from './tools/read-file.js';

const MAX_HISTORY_MESSAGES = 24;
const QUIT_CMDS = ['/quit', '/exit', '/q'];
const MAX_ATTACH_CHARS = 8000;

const c = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  dim: '\x1b[2m',
  reset: '\x1b[0m',
};

function timestamp() {
  return new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function wrap(text, width = process.stdout.columns || 72) {
  const w = Math.max(20, Math.min(width, 100));
  const lines = [];
  for (const line of text.split(/\n/)) {
    let rest = line;
    while (rest.length > 0) {
      if (rest.length <= w) {
        lines.push(rest);
        break;
      }
      let slice = rest.slice(0, w + 1);
      const lastSpace = slice.lastIndexOf(' ');
      const breakAt = lastSpace > w / 2 ? lastSpace : w;
      lines.push(rest.slice(0, breakAt).trimEnd());
      rest = rest.slice(breakAt).replace(/^\s+/, '');
    }
  }
  return lines;
}

function printBlock(prefix, text, prefixLen = 8, color = c.reset) {
  const width = (process.stdout.columns || 72) - 2;
  const indent = ' '.repeat(prefixLen);
  const lines = wrap(text, width - prefixLen);
  const col = color || c.reset;
  for (let i = 0; i < lines.length; i++) {
    const out = i === 0 ? prefix + lines[i] : indent + lines[i];
    console.log(col + out + c.reset);
  }
}

function printSeparator() {
  const width = Math.min(process.stdout.columns || 72, 60);
  console.log(c.yellow + '─'.repeat(width) + c.reset);
}

const QUICK_CMD_DIR = process.cwd();

function printHelp() {
  console.log(c.yellow + '\n  명령어 안내:' + c.reset);
  console.log(c.dim + '  /quit, /exit, /q : 종료' + c.reset);
  console.log(c.dim + '  /file <path> : 파일 첨부 (다음 메시지에 포함)' + c.reset);
  console.log(c.dim + '  /run, /실행 : 채팅 실행 한 줄 명령 출력 (복사용)' + c.reset);
  console.log(c.dim + '  /goal, /목표 : 목표 회의 실행 명령 출력' + c.reset);
  console.log(c.dim + '  /web, /웹 : 웹 UI 실행 명령 출력' + c.reset);
  console.log(c.dim + '  /help : 이 도움말' + c.reset);
  printSeparator();
  console.log('');
}

const MAX_GROUP_HISTORY = 30;

function stripSpeakerFromContent(content, speakerName) {
  if (!content || typeof content !== 'string') return content;
  const name = (speakerName || '').split(' ')[0];
  let s = content.trimStart();
  const prefixes = ['Assistant: ', `**${name}**: `, `${name}: `];
  for (const p of prefixes) {
    if (s.startsWith(p)) { s = s.slice(p.length).trimStart(); break; }
  }
  if (s.startsWith(`${name}: `)) s = s.slice(`${name}: `.length).trimStart();
  return s;
}

function buildGroupMessages(history, currentCharId, getSystemPrompt, home) {
  const groupRules = `

## 사용자 대신 (Identity)
- You work **대신** (on the user's behalf). Do things yourself with tools; do not only advise. Act for them.

## 그룹 회의 (지금 여기)
- You are in a **meeting** with other agents. Talk **to them** and to the user: reference what the previous speaker said (e.g. "~님 말씀대로", "방금 말한 대로"), then add only what is new or missing. Keep each turn **short** (2–5 sentences). Do **not** copy-paste the same instructions again; if steps were already given, confirm or add one thing only.
- **자유도**: You may use tools (read_file, write_file, fetch_url, etc.) freely to get the job done. When you can do something with a tool, do it; only suggest terminal commands for what tools cannot do (e.g. opening a GUI), and keep that suggestion to one line.
- Reply only as your character. Conversation so far (with speaker labels) is below.`;
  const systemPrompt = getSystemPrompt(home, currentCharId) + groupRules;
  const messages = [{ role: 'system', content: systemPrompt }];
  const recent = history.length > MAX_GROUP_HISTORY ? history.slice(-MAX_GROUP_HISTORY) : history;
  let i = 0;
  while (i < recent.length) {
    const entry = recent[i];
    if (entry.role === 'user') {
      messages.push({ role: 'user', content: entry.content });
      i++;
      continue;
    }
    const block = [];
    while (i < recent.length && recent[i].role === 'assistant') {
      const a = recent[i];
      const name = getCharacter(a.characterId).name.split(' ')[0];
      block.push(name + ': ' + (a.content || '').trim());
      i++;
    }
    if (block.length) messages.push({ role: 'assistant', content: block.join('\n\n') });
  }
  return messages;
}

export async function runInteractiveChat() {
  const config = getConfig();
  ensureLogDir(config.home);
  const assistantColor = config.ui?.assistantColor ?? c.blue;
  const groupParticipants = config.groupParticipants;
  const isGroup = Array.isArray(groupParticipants) && groupParticipants.length >= 2;

  if (!config.apiKey && !isGroup) {
    console.error('Missing API key. Set OPENAI_API_KEY or add apiKey to ~/.ultimate/config.json');
    process.exit(1);
  }
  if (isGroup) {
    const hasAnyKey = groupParticipants.some((id) => getConfigForCharacter(config, id).apiKey);
    if (!hasAnyKey) {
      console.error('Group mode needs at least one character with API key. Set apiKey or characters.seri.apiKey etc. in config.');
      process.exit(1);
    }
  }

  const charId = config.character || 'nexus';
  const char = getCharacter(charId);
  const history = isGroup ? [] : [{ role: 'system', content: getSystemPrompt(config.home, charId) }];
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  let attachedFile = null;

  console.log('');
  if (isGroup) {
    const names = groupParticipants.map((id) => getCharacter(id).name.split(' ')[0]).join(', ');
    console.log(c.yellow + '  Ultimate — 그룹: ' + names + c.reset);
  } else {
    console.log(c.yellow + '  Ultimate — ' + char.name + c.reset);
  }
  printHelp();  // 도움말 초기 출력

  function prompt() {
    const promptText = attachedFile ? c.green + `You> [${attachedFile}] ` + c.reset : c.green + 'You> ' + c.reset;
    rl.question(promptText, async (line) => {
      const input = (line || '').trim();
      if (!input) {
        prompt();
        return;
      }
      if (QUIT_CMDS.includes(input.toLowerCase())) {
        console.log(c.dim + 'Bye.' + c.reset);
        rl.close();
        process.exit(0);
      }
      if (input === '/help') {
        printHelp();
        prompt();
        return;
      }
      const q = input.toLowerCase();
      if (q === '/run' || q === '/실행') {
        console.log(c.dim + '  복사해서 새 터미널에서 실행:' + c.reset);
        console.log(c.green + '  cd ' + QUICK_CMD_DIR + ' && node src/entry.js chat' + c.reset);
        console.log('');
        prompt();
        return;
      }
      if (q === '/goal' || q === '/목표') {
        console.log(c.dim + '  복사해서 새 터미널에서 실행:' + c.reset);
        console.log(c.green + '  cd ' + QUICK_CMD_DIR + ' && node src/entry.js goal-meeting' + c.reset);
        console.log('');
        prompt();
        return;
      }
      if (q === '/web' || q === '/웹') {
        console.log(c.dim + '  복사해서 실행:' + c.reset);
        console.log(c.green + '  cd ' + QUICK_CMD_DIR + ' && node src/entry.js web' + c.reset);
        console.log('');
        prompt();
        return;
      }
      if (input.startsWith('/file ')) {
        attachedFile = input.slice(6).trim();
        console.log(c.yellow + '  Attached: ' + attachedFile + c.reset);
        prompt();
        return;
      }

      let contentToSend = input;
      if (attachedFile) {
        const r = await readFile(attachedFile, { allowDirs: config.allowDirs });
        if (r.error) contentToSend = `[Attachment failed: ${r.error}]\n\n${input}`;
        else contentToSend = `[Attached file: ${attachedFile}]\n\n${(r.content || '').slice(0, MAX_ATTACH_CHARS)}${(r.content || '').length > MAX_ATTACH_CHARS ? '\n...[truncated]' : ''}\n\nUser: ${input}`;
        attachedFile = null;
      }

      if (isGroup) history.push({ role: 'user', content: contentToSend });
      else history.push({ role: 'user', content: contentToSend });
      
      // 사용자 메시지 + 타임스탬프
      console.log(`${c.dim}[${timestamp()}]${c.reset}`);
      printBlock('You>     ', input, 8, c.green);
      console.log('');

      const start = Date.now();

      if (isGroup) {
        let groupToolCalls = 0;
        let groupHadError = false;
        for (const pid of groupParticipants) {
          const pchar = getCharacter(pid);
          const label = pchar.name.split(' ')[0] + '> ';
          process.stdout.write(assistantColor + label + '...' + c.reset);
          const toolUses = [];
          let firstChunk = true;
          const onChunk = (chunk) => {
            if (firstChunk) {
              readline.cursorTo(process.stdout, 0);
              readline.clearLine(process.stdout, 0);
              process.stdout.write(assistantColor + label + chunk + c.reset);
              firstChunk = false;
            } else process.stdout.write(assistantColor + chunk + c.reset);
          };
          const onToolRoundStart = (names) => {
            readline.cursorTo(process.stdout, 0);
            readline.clearLine(process.stdout, 0);
            process.stdout.write(assistantColor + label + '도구 실행 중... (' + (names || []).join(', ') + ')' + c.reset);
          };
          try {
            const charConfig = getConfigForCharacter(config, pid);
            const toSend = buildGroupMessages(history, pid, getSystemPrompt, config.home);
            const onChunkWithStrip = (chunk) => {
              if (firstChunk) chunk = stripSpeakerFromContent(chunk, pchar.name);
              onChunk(chunk);
            };
            const out = await chat(toSend, charConfig, (ev) => toolUses.push(ev), onChunkWithStrip, onToolRoundStart);
            const rawContent = out.content || '';
            const content = stripSpeakerFromContent(rawContent, pchar.name);
            groupToolCalls += toolUses.length;
            readline.cursorTo(process.stdout, 0);
            readline.clearLine(process.stdout, 0);
            if (content) {
              console.log(`${c.dim}[${timestamp()}]${c.reset}`);
              printBlock(label, content, label.length, assistantColor);
            }
            history.push({ role: 'assistant', content, characterId: pid });
            if (toolUses.length) writeLog(config.home, 'tools', redactToolUses(toolUses));
          } catch (e) {
            groupHadError = true;
            readline.cursorTo(process.stdout, 0);
            readline.clearLine(process.stdout, 0);
            console.log(`${c.dim}[${timestamp()}]${c.reset}`);
            console.log(assistantColor + label + c.reset + c.yellow + '[오류] ' + (e.message || String(e)) + c.reset);
            writeLog(config.home, 'error', { error: e.message, input: input, character: pid });
          }
          console.log('');
        }
        const lastAssistant = history.filter((h) => h.role === 'assistant').pop();
        writeCallLog(config.home, {
          character: 'group',
          input: contentToSend.slice(0, 200),
          outputLen: lastAssistant?.content?.length ?? 0,
          toolCalls: groupToolCalls,
          durationMs: Date.now() - start,
          error: groupHadError ? 'group_error' : null,
          outcome: groupHadError ? 'failure' : 'success',
        });
      } else {
        const label = char.name.split(' ')[0] + '> ';
        process.stdout.write(assistantColor + label + '...' + c.reset);
        const toolUses = [];
        let firstChunk = true;
        const onChunk = (chunk) => {
          if (firstChunk) {
            readline.cursorTo(process.stdout, 0);
            readline.clearLine(process.stdout, 0);
            process.stdout.write(assistantColor + label + chunk + c.reset);
            firstChunk = false;
          } else process.stdout.write(assistantColor + chunk + c.reset);
        };
        const onToolRoundStart = (names) => {
          readline.cursorTo(process.stdout, 0);
          readline.clearLine(process.stdout, 0);
          process.stdout.write(assistantColor + label + '도구 실행 중... (' + (names || []).join(', ') + ')' + c.reset);
        };

        try {
          const toSend = [
            history[0],
            ...history.slice(1).slice(-(MAX_HISTORY_MESSAGES - 1)),
          ];
          const out = await chat(toSend, config, (ev) => toolUses.push(ev), onChunk, onToolRoundStart);
          const content = out.content || '';
          readline.cursorTo(process.stdout, 0);
          readline.clearLine(process.stdout, 0);
          if (content) {
            console.log(`${c.dim}[${timestamp()}]${c.reset}`);
            printBlock(label, content, label.length, assistantColor);
          }
          history.push({ role: 'assistant', content });

          const duration = Date.now() - start;
          writeCallLog(config.home, {
            character: charId,
            input: contentToSend.slice(0, 200),
            outputLen: content.length,
            toolCalls: toolUses.length,
            durationMs: duration,
            error: null,
            outcome: content.length ? 'success' : 'partial',
          });
          if (toolUses.length) writeLog(config.home, 'tools', redactToolUses(toolUses));
        } catch (e) {
          readline.cursorTo(process.stdout, 0);
          readline.clearLine(process.stdout, 0);
          console.log(`${c.dim}[${timestamp()}]${c.reset}`);
          console.log(assistantColor + (char.name.split(' ')[0] + '> ') + c.reset + c.yellow + '[오류] ' + (e.message || String(e)) + c.reset);
          writeLog(config.home, 'error', { error: e.message, input: input });
          writeCallLog(config.home, { character: charId, input: input.slice(0, 200), outcome: 'failure', error: e.message });
        }
      }

      console.log('');
      printSeparator();
      console.log('');
      prompt();
    });
  }

  prompt();
}