# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Ultimate Agent — Node.js 22+ ESM 프로젝트. CLI 채팅, Goal Mode, Web UI, Electron 데스크톱 앱을 지원하는 로컬 AI 에이전트.

### Running services

- **Web UI**: `node -e "import('./src/web-server.js').then(m => m.startWebServer())"` → http://localhost:3000/chat
  - Note: `node src/entry.js web` has a bug (`runWebServer` vs `startWebServer` mismatch), use the direct import above instead.
- **CLI**: `node src/entry.js chat "메시지"` (one-shot) or `node src/entry.js` (usage)

### Testing

- `npm test` — 22 regression tests via `node --test` (read-file, write-file, evolution-gate, redact-tools, fetch-url-security, restart-guard)
- No ESLint or linting configuration exists in this project.

### API keys

LLM 기능(chat, goal, evolve)에는 API 키가 필요합니다. `OPENAI_API_KEY`, `XAI_API_KEY`, 또는 `GROQ_API_KEY` 환경변수를 설정하거나 `~/.ultimate/config.json`에 `{ "apiKey": "..." }`를 추가하세요. API 키 없이도 Web UI 서빙, 테스트 실행, CLI usage 확인은 가능합니다.

### Key commands

See `package.json` scripts section and `README.md` § 실행 방법.
