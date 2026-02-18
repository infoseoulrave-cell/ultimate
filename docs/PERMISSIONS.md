# 권한·안전 설계

## 1. 원칙

- **도구 로그**: 파일 내용·URL 응답 본문은 **기록하지 않는다**. 경로·URL·성공/실패·에러 메시지만 audit.
- **허용 경로(allowlist)**: `read_file`·`write_file`은 `allowDirs`(config + 기본 cwd, ~/.ultimate) 내만 접근.
- **위험 동작**: `run_openclaw`는 타임아웃 필수. (선택) 승인 플래그로 사용자 확인 후 실행.
- **fetch_url**: 공개 http/https만. 사설 대역·localhost·file 차단. 응답 크기 상한으로 메모리 보호.

---

## 2. 허용 경로(allowlist)

| 설정 | 기본값 | 설명 |
|------|--------|------|
| `allowDirs` | `[process.cwd(), ~/.ultimate]` | 파일 읽기/쓰기 허용 디렉터리. 그 하위만 접근 가능. |

- 경로는 `resolve` 후 allowlist와 비교. 허용 외 경로는 `read_file`·`write_file` 모두 거부.

---

## 3. 위험 동작 정의

| 동작 | 대응 |
|------|------|
| `run_openclaw` | 타임아웃(기본 60초). (선택) `openclawRequireApproval` 시 승인 없으면 미실행. |
| 파일 쓰기 | allowlist 내만. |
| 외부 전송 | 현재 도구 중 “데이터 외부 전송” 전용 도구 없음. 추가 시 승인·허용 목록 정의. |
| 시스템 설정 변경 | 직접 도구 없음. openclaw 경유 시 openclaw 정책 따름. |

---

## 4. Audit 로그 포맷

- **호출 로그** (`logs/calls-*.log`): `input` 요약, `outcome`, `toolCalls` 수, `durationMs`, `error`. **본문·파일 내용 미포함.**
- **도구 로그** (`session-*.log`의 tools): `name`, `args`(경로/URL은 포함 가능), **result는 “ok”/“error”+이유만.** 파일 내용·fetch 본문은 기록하지 않음.

---

## 5. 진화·안전

- **진화 게이트**: 회의 합의를 시스템 프롬프트에 넣기 전에 검증. 원칙 위반·권한 완화 문구 포함 시 적용 거부. 패치 길이 상한.
- **안전성 요약**: [README § 실행 방법](README.md) 및 [DUAL-IDENTITY-EVOLUTION](DUAL-IDENTITY-EVOLUTION.md).

Form is the proof of logic. — NEXUS
