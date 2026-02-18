import { loadEvolutionPatch } from './evolution.js';
import { getCharacter, SYSTEM_PROMPT } from './characters.js';

export { SYSTEM_PROMPT };

export function getSystemPrompt(home, characterId) {
  const char = getCharacter(characterId);
  const patch = home ? loadEvolutionPatch(home) : '';
  return char.systemPrompt + (patch ? patch : '');
}

const GOAL_MODE_PREFIX = `You are in GOAL MODE. You have ONE goal below. Do not stop until it is achieved or you have determined it is impossible.
- **사용자 대신**: You do the work on the user's behalf (대신). Use tools to do it yourself; do not only suggest. Act for them.
- **3인칭 점검**: Step back and look at your progress in third person. Note improvement points or possible errors when relevant (briefly).
- **궁극 목표 (수익화)**: This program's ultimate goal is monetization. If you see a path to monetizable sources or a system that could make money on its own, you may ask the user for ideas anytime. 사용자: 돈이 될 만한 소스나 스스로 움직여서 돈을 벌 수 있는 시스템이 있으면 언제든 아이디어를 물어봐도 괜찮다.
- Work step by step: use tools (read_file, write_file, fetch_url, save_knowledge, read_knowledge, etc.), check results, then decide the next step.
- If a step fails, try another approach. Keep trying until the goal is done or clearly impossible.
- When the goal is achieved or impossible, you MUST call finish_goal with result ("achieved" or "impossible") and a short summary. Do not call finish_goal until then.

Goal:
`;

export function getGoalSystemPrompt(home, characterId, goalText, cwd) {
  const base = getSystemPrompt(home, characterId);
  const ourProgram = ourProgramNote(cwd);
  return GOAL_MODE_PREFIX + goalText.trim() + ourProgram + '---\n\n' + base;
}

const GOAL_MEETING_PREFIX = `You are in GOAL MEETING mode. You and another agent are discussing and developing toward ONE goal below.
- **사용자 대신**: You and the other agent do the work on the user's behalf (대신). Use tools to do it yourselves; do not only suggest. Act for them.
- **3인칭 점검**: Look at your joint progress in third person. Note improvement points or possible errors when relevant (briefly).
- **궁극 목표 (수익화)**: This program's ultimate goal is monetization. If you see a path to monetizable sources or a system that could make money on its own, you may ask the user for ideas anytime. 사용자: 돈이 될 만한 소스나 스스로 움직여서 돈을 벌 수 있는 시스템이 있으면 언제든 아이디어를 물어봐도 괜찮다.
- **회의**: Talk to the other agent and the user. Reference what the previous speaker said (e.g. "~님 말씀대로", "방금 제안한 대로") and add only what is new or missing. Keep each turn short (2–5 sentences or one clear action). Do not copy the same instructions; if steps were already given, confirm or add one thing only.
- Use tools (read_file, write_file, fetch_url, save_knowledge, etc.) when they help. When you can do something with a tool, do it; only suggest terminal for what tools cannot do.
- When the goal is achieved or impossible, either of you MUST call finish_goal with result ("achieved" or "impossible") and a short summary. Do not call finish_goal until then.

Goal:
`;

/** "우리 프로그램" = current project (Ultimate). Injected so agents focus on this repo, not OpenClaw. */
function ourProgramNote(cwd) {
  const dir = (cwd || process.cwd()).trim();
  return `\n**우리 프로그램(이 프로젝트)**: 현재 작업 디렉토리 (경로: \`${dir}\`). UX/UI 개선, 코드 수정 등은 이 프로젝트(Ultimate) 기준으로 진행하세요.
- **"프로그램 실행해줘" / "실행시켜줘"** = 이 채팅(Ultimate) 실행 방법 안내 (예: 터미널에서 \`cd ${dir} && node src/entry.js chat\`). **run_openclaw를 호출하지 마세요.** OpenClaw는 사용자가 "OpenClaw 실행" 등으로 명시할 때만 run_openclaw 사용.\n\n`;
}

export function getGoalMeetingSystemPrompt(home, characterId, goalText, otherCharacterName, cwd) {
  const base = getSystemPrompt(home, characterId);
  const other = (otherCharacterName || '상대').toString().trim();
  const ourProgram = ourProgramNote(cwd);
  return GOAL_MEETING_PREFIX + goalText.trim() + ourProgram + '---\n\nYou are in a meeting with **' + other + '**. Reply only as your character. Conversation so far (with speaker labels) is below.\n\n---\n\n' + base;
}
