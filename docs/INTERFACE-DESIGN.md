# 인터페이스 디자인

Ultimate는 **웹/데스크톱 앱이 아니라** 로컬에서 돌리는 **CLI + 터미널 채팅(TUI)** 만 제공한다.

---

## 1. CLI 인터페이스

**진입점**: `ultimate` (또는 `node src/entry.js`)

| 명령 | 동작 |
|------|------|
| 인자 없음 / 알 수 없는 명령 | **usage** 출력 + Quick start 한 줄. exit 0. |
| `chat` | 대화. 인자 있으면 한 번 보내고 응답 출력; 없으면 **인터랙티브 TUI** 진입. |
| `evolve` | NEXUS vs OBSERVER 자기 회의 1회. 결과 + evolution.log/patch 갱신. |
| `logs` | 로그 디렉터리 경로 + 오늘 호출 요약(최근 5줄). |

**설계 원칙**
- 서브커맨드는 `chat`, `logs`, `evolve` 세 가지로 고정. 그 외는 모두 usage로 처리.
- usage는 **stderr**로만 출력해, 파이프 시 stdout에는 다른 것만 나가게 함.
- Quick start 문구로 “다음에 뭘 할지” 한 줄 안내.

---

## 2. 채팅 TUI (인터랙티브)

**진입**: `ultimate chat` 인자 없이 실행 + TTY일 때.

**테마 (검은 화면 + 초록·파랑·노랑, 미니멀)**
- **초록**: 사용자 입력·`You>` 프롬프트.
- **파랑**: 에이전트 응답·`Ultimate>` 프롬프트.
- **노랑**: 제목·구분선·첨부 안내.
- **dim**: 부가 안내(종료/첨부 명령). 배경은 터미널 기본(검은 화면 권장).

**레이아웃**
- **상단**: 제목(노랑) + 안내(dim: `/quit`, `/file <path>`) + 구분선(노랑).
- **대화**: You>(초록) + 사용자 텍스트(초록), Ultimate>(파랑) + 응답(파랑). 줄바꿈·들여쓰기 동일.
- **파일 첨부**: `/file <path>` 입력 시 다음 메시지에 해당 파일 내용이 포함됨. 프롬프트에 `[path]` 표시.

**텍스트 처리**
- **줄바꿈**: 터미널 너비(`process.stdout.columns`, 기본 72)에 맞춤. 최소 20, 최대 100자.
- **단어 단위**: 공백 위치에서 끊어서 다음 줄로. 접두어 길이(8)만큼 들여쓰기 유지.
- **Thinking 중**: `Ultimate> `만 먼저 찍고, 응답 오면 그 줄을 지운 뒤 실제 응답을 `printBlock`으로 출력.

**종료**
- `/quit`, `/exit`, `/q` (대소문자 무관) 입력 시 “Bye.” 출력 후 프로세스 종료.

**에러**
- API 키 없음: stderr 메시지 후 exit 1.
- API/도구 에러: `Ultimate> [오류] ...` 형태로 한 줄 출력 후 다음 턴으로.

---

## 3. 단발 채팅 (비대화형)

**진입**: `ultimate chat "메시지"` 또는 `ultimate chat -f <path> "메시지"` / `--file <path> "메시지"`, 또는 `echo "메시지" | ultimate chat`.

**동작**
- `-f`/`--file`: path를 allowlist 내에서 읽어, 메시지 앞에 `[Attached file: path]` + 내용(최대 8K자)을 붙여 전송. 에이전트가 해당 내용을 바탕으로 추론.
- 프롬프트·구분선 없이 **응답 본문만 stdout**에 출력. 로그·호출 로그는 기존대로 기록.

---

## 4. 의도적으로 하지 않은 것

- **GUI/웹 UI**: 없음. 데스크톱 앱(Tauri/Electron) 계획 없음.
- **색상/테마**: 터미널 기본 색만 사용. ANSI 색 코드 없음.
- **멀티라인 입력**: TUI에서는 한 줄만 받음. 여러 줄은 단발 모드에서 stdin으로.
- **히스토리 파일**: readline 기본 동작만 사용. 위/아래 화살표 히스토리는 셸에 따름.

---

## 5. 구현 위치

| 요소 | 파일 |
|------|------|
| CLI 라우팅·usage | `src/entry.js` |
| 채팅 TUI (wrap, printBlock, separator, readline 루프) | `src/chat-ui.js` |
| 단발 채팅 출력 | `src/entry.js` (chat 호출 후 content만 출력) |

Form is the proof of logic. — NEXUS
