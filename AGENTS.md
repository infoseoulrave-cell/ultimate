# AGENTS.md

## Cursor Cloud specific instructions

### Overview
Ultimate is a local AI agent (CLI + Web UI + Electron desktop) with NEXUS persona. Node.js >=22, Express backend, Tailwind CSS frontend.

### Running services

| Service | Command | Notes |
|---------|---------|-------|
| **Unit tests** | `npm test` | Runs 22 tests via `node --test`. No API key needed. |
| **Web UI** | `node -e "import('./src/web-server.js').then(m => m.startWebServer())"` | Serves at `http://localhost:3000/chat`. See known issue below. |
| **CLI (usage)** | `node src/entry.js` | Prints usage/help. |
| **CLI (chat)** | `node src/entry.js chat "message"` | Requires `OPENAI_API_KEY` env var or `~/.ultimate/config.json`. |

### Known issues

- `npm run web` / `node src/entry.js web` fails because `entry.js` imports `runWebServer` but `web-server.js` exports `startWebServer`. Start the web server directly: `node -e "import('./src/web-server.js').then(m => m.startWebServer())"`.
- No lockfile exists in the repo; `npm install` generates `package-lock.json` locally.
- No lint tool (ESLint, etc.) is configured in the project.

### API keys
LLM-dependent features (chat, goal, evolve) require `OPENAI_API_KEY` (or `XAI_API_KEY` / `GROQ_API_KEY`). Tests run without any API key.
