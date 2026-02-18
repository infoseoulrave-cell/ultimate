# ultimate

로컬 통합 제어, API 기반 지능, 따뜻한 페르소나를 갖춘 에이전트 프로젝트.

## 비전

- **로컬 통합 제어**: openclaw 스타일로 로컬 머신을 하나의 시스템으로 제어.
- **자유도**: 높은 확장성과 행동 공간.
- **API 두뇌**: 외부·내부 API를 활용한 판단·실행.
- **따뜻한 감정**: 구조적 엄밀성(CSA/NEXUS)과 사용자에게 느껴지는 따뜻함의 공존.

## 설계 원칙: NEXUS / CSA

설계와 의사결정은 **Chief Systems Architect (CSA)** 페르소나 **NEXUS**에 따른다.

- *Form is the proof of logic.*
- 전략·운영·커뮤니케이션·평가를 하나의 **작동 원리**로 정리.  
→ [docs/NEXUS-CSA.md](docs/NEXUS-CSA.md)

## 문서

| 문서 | 설명 |
|------|------|
| [docs/NEXUS-CSA.md](docs/NEXUS-CSA.md) | NEXUS 페르소나, CSA 직책, 작동 원리 |
| [docs/AGENT-DESIGN.md](docs/AGENT-DESIGN.md) | 에이전트 설계: 로컬 제어 + API 지능 + 감정 레이어 |
| [docs/OPENCLAW-STRUCTURE.md](docs/OPENCLAW-STRUCTURE.md) | 로컬 설치 openclaw 프로그램 구조·아키텍처 |
| [docs/BUILD-GAPS-AND-ROADMAP.md](docs/BUILD-GAPS-AND-ROADMAP.md) | 제작 시 갖춘 것 vs 빠진 것, 보완 순서·로드맵 |
| [docs/DEVELOPMENT-STRATEGY.md](docs/DEVELOPMENT-STRATEGY.md) | 어떻게 개발하면 가장 진화된 에이전트가 나오는지 (단계별 진행 전략) |
| [docs/STRATEGY-PLUGINS-SKILLS.md](docs/STRATEGY-PLUGINS-SKILLS.md) | 플러그인·스킬 활용 전략 (OpenClaw 재사용 vs 우리가 만들기) |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Ultimate 아키텍처 (진입점, OpenClaw 관계, 데이터 흐름) |
| [docs/DUAL-IDENTITY-EVOLUTION.md](docs/DUAL-IDENTITY-EVOLUTION.md) | 이중 정체성(NEXUS/OBSERVER) 회의로 회귀·진화하는 루프 |
| [docs/SUBAGENT-TEAM-MEETING.md](docs/SUBAGENT-TEAM-MEETING.md) | 서브에이전트 팀(헤드 1 + 10명) 토론 — 현황·다음 액션 |
| [docs/PERMISSIONS.md](docs/PERMISSIONS.md) | 권한·안전 설계 (allowlist, audit, 진화 게이트) |
| [docs/INTERFACE-DESIGN.md](docs/INTERFACE-DESIGN.md) | CLI·채팅 TUI 인터페이스 설계 |

## Quick start

1. `cd ultimate` → `export OPENAI_API_KEY=sk-...` (또는 `~/.ultimate/config.json`에 `apiKey`)  
2. `node src/entry.js chat "안녕"` 또는 `node src/entry.js` → usage + 채팅 안내  
3. `node src/entry.js evolve` → 자기 회의(진화). `node src/entry.js logs` → 로그 확인  
4. `npm test` → 회귀 테스트

## 실행 방법

**요구사항**: Node 22+, OpenAI API 키 (또는 호환 엔드포인트).

```bash
cd ultimate
export OPENAI_API_KEY=sk-...
# 또는 ~/.ultimate/config.json 에 { "apiKey": "sk-...", "model": "gpt-4o-mini" }

node src/entry.js chat "오늘 할 일 정리해줘"
# 인자 없이: node src/entry.js → usage + Quick start
# 전역: npm link 후 ultimate chat "메시지"
```

**도구**: 에이전트는 필요 시 **인터넷**(`fetch_url`), **지식 학습**(`save_knowledge` / `read_knowledge`), `run_openclaw`, `read_file`·`write_file`을 사용한다.  
**파일 첨부**: `ultimate chat -f <path> "메시지"` 또는 TUI에서 `/file <path>` 후 메시지 입력 시, allowlist 내 파일을 읽어 내용을 메시지에 붙이고 에이전트가 그걸 바탕으로 추론한다.  
**TUI 테마**: 검은 화면에 초록(You)·파랑(Ultimate)·노랑(제목·구분선)으로 심플·미니멀.

**로그·KPI**: `~/.ultimate/logs/` 에 세션·호출 로그가 쌓인다. `node src/entry.js logs` 로 오늘 호출 요약 확인.

**자기 회귀·진화**: NEXUS/OBSERVER 회의는 `node src/entry.js evolve`. 합의는 **진화 게이트**(원칙 위반·길이 검사) 통과 시에만 `evolution-patch.md`에 반영된다.  
**안전·권한**: 도구 로그에는 파일/URL 본문을 남기지 않음. run_openclaw 타임아웃, fetch_url SSRF·크기 제한. [docs/PERMISSIONS.md](docs/PERMISSIONS.md)

## 구조

```
ultimate/
├── README.md
├── package.json
├── src/
│   ├── entry.js        # CLI (chat, logs)
│   ├── config.js       # ~/.ultimate/config.json + env
│   ├── persona.js      # NEXUS + 따뜻한 페르소나 시스템 프롬프트
│   ├── brain.js        # LLM 호출 + 도구 루프
│   ├── log.js          # 로그 기록
│   └── tools/
│       ├── index.js    # 도구 정의
│       ├── fetch-url.js   # URL 조회 (인터넷)
│       ├── knowledge.js  # 지식 저장·검색
│       ├── run-openclaw.js
│       ├── write-file.js
│       └── read-file.js
├── test/                  # 회귀 테스트 (권한, 진화 게이트, redact)
├── docs/
└── ~/.ultimate/        # config.json, logs/, knowledge/
```

이 저장소는 그 설계와 구현의 **연결점(NEXUS)** 이다.
