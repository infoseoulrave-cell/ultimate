# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Ultimate Agent is a Node.js (>=22) CLI/Web/Electron AI agent with multiple LLM backend support (OpenAI, xAI/Grok, Groq). No build step required — pure ES modules.

### Running services

- **Web UI**: `node -e "import('./src/web-server.js').then(m => m.startWebServer())"` starts the Express server at `http://localhost:3000/chat`. Note: `npm run web` has a naming mismatch (`runWebServer` vs `startWebServer`); use the one-liner above as a workaround.
- **CLI**: `node src/entry.js` (see `package.json` scripts for chat, logs, evolve, goal, web subcommands).
- **Tests**: `npm test` — uses Node.js built-in test runner, 22 tests across 6 files.

### Key caveats

- No ESLint or TypeScript configured; there is no lint command.
- No `package-lock.json` exists — `npm install` resolves fresh each time.
- LLM features require one of `OPENAI_API_KEY`, `XAI_API_KEY`, or `GROQ_API_KEY` set as env var (or in `~/.ultimate/config.json` as `apiKey`). Without a key, the web server starts but chat API calls return a 500 error explaining the missing key.
- Configuration stored in `~/.ultimate/` (config, logs, knowledge).
