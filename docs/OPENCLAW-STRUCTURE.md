# OpenClaw 프로그램 구조

로컬 설치 경로: `/opt/homebrew/lib/node_modules/openclaw`  
실행 진입점: `/opt/homebrew/bin/openclaw` → `../lib/node_modules/openclaw/openclaw.mjs`

---

## 1. 개요

- **정의**: Multi-channel AI gateway. 개인용 AI 어시스턴트를 로컬에서 실행하고, 여러 채널(WhatsApp, Telegram, Slack 등)과 연동한다.
- **버전**: 2026.2.15
- **런타임**: Node ≥22, ESM (`"type": "module"`)
- **설정**: `~/.openclaw/openclaw.json` (JSON5, 선택)

---

## 2. 디렉터리 구조

```
openclaw/
├── openclaw.mjs          # CLI 진입점 (dist/entry.js 또는 dist/entry.mjs 로드)
├── package.json
├── dist/                 # 빌드 산출물 (번들된 JS)
│   ├── entry.js          # CLI 메인 (profile, gateway, agent, onboard 등)
│   ├── daemon-cli.js
│   ├── plugin-sdk/       # 플러그인/채널 개발용 SDK (타입·유틸)
│   ├── gateway/          # Gateway 서버·WS·메서드
│   ├── channels/         # 채널 레지스트리·플러그인 타입·어댑터
│   ├── agents/           # 에이전트·세션·도구
│   └── ...               # (많은 청크 파일)
├── extensions/           # 채널·기능 확장 플러그인 (38개)
├── skills/               # 스킬 패키지 (53개)
├── docs/                 # 문서 (설치·채널·게이트웨이·개념 등)
├── assets/
└── node_modules/
```

---

## 3. 진입점·CLI

- **실행**: `openclaw` → `openclaw.mjs`  
  - `./dist/warning-filter.js` 로드 시도 후  
  - `./dist/entry.js` 또는 `./dist/entry.mjs` 임포트.
- **entry.js 역할**:  
  - 홈 디렉터리/프로필 해석 (`OPENCLAW_HOME`, 프로필)  
  - 서브커맨드 라우팅: `gateway`, `agent`, `onboard`, `configure`, `doctor`, `message send` 등  
  - Gateway 포트·Nix 모드·채널 레지스트리·gateway 메서드 등 초기화.

---

## 4. 아키텍처 (데이터 플로우)

```
채널 (WhatsApp / Telegram / Slack / Discord / … / WebChat)
                    │
                    ▼
┌─────────────────────────────────────┐
│              Gateway                │
│   (제어 평면, ws://127.0.0.1:18789)  │
└──────────────────┬──────────────────┘
                    │
    ├─ Pi agent (RPC)
    ├─ CLI (openclaw …)
    ├─ WebChat / Control UI
    ├─ macOS 앱
    └─ iOS / Android nodes
```

- **Gateway**: 세션·채널·도구·이벤트의 단일 제어 평면. 설정은 `openclaw.json` + 스키마 검증.
- **에이전트**: Pi agent 런타임(RPC), 도구 스트리밍·블록 스트리밍.
- **채널**: extensions 내 플러그인으로 구현 (어댑터: 메시징·아웃바운드·페어링·보안 등).

---

## 5. Extensions (채널·기능 플러그인)

위치: `extensions/`

| 구분 | 예시 |
|------|------|
| 채널 | telegram, whatsapp, discord, slack, signal, imessage, googlechat, msteams, matrix, zalo, zalouser, bluebubbles, irc, line, feishu, mattermost, twitch, nostr, tlon, nextcloud-talk |
| 기능 | device-pair, diagnostics-otel, memory-core, memory-lancedb, voice-call, talk-voice, phone-control, llm-task, open-prose, thread-ownership, copilot-proxy, lobster, minimax-portal-auth, qwen-portal-auth, google-antigravity-auth, google-gemini-cli-auth |

각 확장은 `openclaw.plugin.json` (id, channels, configSchema 등) + `index.ts` + `src/` 구조.

---

## 6. Skills

위치: `skills/`

에이전트가 쓸 수 있는 도구/스킬 패키지. 예: 1password, apple-notes, bear-notes, canvas, coding-agent, discord, github, himalaya, notion, obsidian, openai-image-gen, openai-whisper, spotify-player, things-mac, tmux, weather, voice-call 등 50여 개.  
ClawHub로 스킬 검색·설치 가능.

---

## 7. 설정·플러그인 SDK

- **설정**: `~/.openclaw/openclaw.json`  
  - `agents.defaults` (workspace, model, heartbeat 등)  
  - `channels.<provider>` (allowFrom, dmPolicy 등)  
  - `gateway` (port, bind, tailscale, auth)  
  - 스키마 불일치 시 Gateway 기동 거부.
- **플러그인 SDK** (`dist/plugin-sdk/`, `package.json` exports `"./plugin-sdk"`):  
  - 채널 어댑터 타입: ChannelMessagingAdapter, ChannelOutboundAdapter, ChannelPairingAdapter, ChannelConfigAdapter 등  
  - Gateway 메서드: GatewayRequestHandler, RespondFn  
  - 플러그인 런타임·로거·설정 스키마·HTTP 라우트 등  
  - 외부 플러그인/채널 개발 시 이 SDK 사용.

---

## 8. CLI 주요 명령

| 명령 | 역할 |
|------|------|
| `openclaw onboard` | 온보딩 마법사 (설정·채널·스킬) |
| `openclaw gateway` | Gateway 서버 기동 (기본 포트 18789) |
| `openclaw agent` | 에이전트 호출 (--message, --thinking 등) |
| `openclaw message send` | 특정 타깃으로 메시지 전송 |
| `openclaw config get/set/unset` | 설정 읽기/쓰기 |
| `openclaw doctor` | 진단·마이그레이션·수정 |
| `openclaw dashboard` | Control UI 열기 |

---

## 9. ultimate 연동 시 참고

- **제어 레이어**: Gateway가 WS(18789)로 제어 평면 제공. 원격은 Tailscale Serve/Funnel 또는 SSH 터널.
- **에이전트 호출**: `openclaw agent --message "..."` 또는 RPC 모드 (`openclaw agent --mode rpc --json`).
- **통합 시**: Gateway 클라이언트로 WS 연결하거나, CLI를 서브프로세스/스크립트로 호출하는 방식으로 openclaw를 “로컬 통합 제어”의 한 노드로 둘 수 있음.
- **확장**: 새 채널·기능은 `extensions/` 스타일 플러그인 + plugin-sdk 타입; 새 도구는 skills 형태로 추가.

문서: [docs.openclaw.ai](https://docs.openclaw.ai) · 저장소: [openclaw/openclaw](https://github.com/openclaw/openclaw)
