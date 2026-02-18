# Ultimate 아키텍처

## 한 줄 정의

**Ultimate**는 사용자 메시지를 받아 **NEXUS 원칙 + 따뜻한 페르소나**로 LLM 두뇌가 판단하고, 필요 시 **인터넷 조회·지식 저장·OpenClaw·파일** 등 도구를 쓴 뒤, 응답을 돌려주는 **로컬 실행 CLI 에이전트**다. 프로그램은 사용자 머신에서만 실행되며, 인터넷에 나가 정보를 가져오고 스스로 지식 저장소에 쌓아 두었다가 나중에 활용할 수 있다.

---

## 관계도

```
사용자 (CLI / OpenClaw WebChat 등)
        │
        ▼
┌─────────────────────────────────────┐
│  Ultimate                            │
│  ├─ entry (CLI)                      │
│  ├─ brain (LLM + 도구 루프)           │
│  ├─ persona (시스템 프롬프트)          │
│  └─ tools (fetch_url, save/read_knowledge, run_openclaw, read_file) │
└──────────────┬──────────────────────┘
               │
               ├── LLM API (OpenAI 등)
               ├── 인터넷 (fetch_url: 공개 URL 조회)
               ├── 지식 저장소 (~/.ultimate/knowledge/store.jsonl)
               ├── OpenClaw CLI (서브프로세스)
               └── 로컬 파일 (허용 경로)
```

- **OpenClaw**: Gateway·채널·기존 스킬은 그대로 사용. Ultimate는 OpenClaw **밖**에서 동작하는 프로세스이며, 필요 시 `openclaw agent ...` 를 **도구**로 호출한다.
- **진입점**: `ultimate chat "메시지"` (CLI). 추후 OpenClaw 스킬로 패키징하면 OpenClaw 에이전트가 Ultimate를 도구로 호출 가능.

---

## 데이터 흐름

1. **입력**: `ultimate chat "오늘 할 일 정리해줘"` → CLI가 메시지 수집.
2. **설정**: `~/.ultimate/config.json` + 환경 변수에서 API 키·모델·허용 경로 로드.
3. **두뇌**: 시스템 프롬프트(NEXUS + 페르소나) + 사용자 메시지 → LLM 호출. LLM이 도구 사용을 요청하면 도구 실행 후 결과를 컨텍스트에 넣고 재호출 (최대 N회).
4. **도구**: `fetch_url` → 공개 URL 본문 조회(HTML은 텍스트로 변환). `save_knowledge` / `read_knowledge` → 스스로 익힌 지식을 로컬 저장·검색. `run_openclaw` → openclaw agent 실행. `read_file` → 허용 디렉터리 내 파일만 읽기.
5. **출력**: 최종 응답 텍스트를 stdout에 출력.
6. **로그**: 매 호출마다 입력/출력/도구 사용/에러를 `~/.ultimate/logs/` 에 기록 (피드백 루프용).

---

## 디렉터리 구조

```
ultimate/
├── package.json
├── src/
│   ├── entry.js      # CLI 진입
│   ├── config.js     # 설정 로드
│   ├── persona.js    # 시스템 프롬프트
│   ├── brain.js      # LLM 호출 + 도구 루프
│   ├── log.js        # 로그 기록
│   └── tools/
│       ├── index.js  # 도구 정의 + 실행 라우팅
│       ├── run-openclaw.js
│       ├── fetch-url.js    # URL 조회, HTML→텍스트
│       ├── knowledge.js   # save_knowledge, read_knowledge
│       └── read-file.js
├── docs/
└── ~/.ultimate/
    ├── config.json   # 선택
    ├── logs/         # 세션·호출 로그
    ├── knowledge/    # store.jsonl (스스로 쌓은 지식)
    ├── evolution.log # 자기 회의 이력 (append)
    └── evolution-patch.md # 최근 진화 합의 → 다음 채팅에 반영
```

Form is the proof of logic. — NEXUS
