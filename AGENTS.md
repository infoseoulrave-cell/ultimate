# AGENTS.md

## Cursor Cloud specific instructions

### 프로젝트 개요
Ultimate은 로컬 AI 에이전트 (Node.js, ES Modules). CLI 채팅, Goal 모드, 웹 UI(Express, port 3000), Electron 데스크톱 앱을 제공한다. 상세 설계 문서는 `docs/` 디렉토리 참조.

### 서비스 실행
- **CLI**: `node src/entry.js chat "메시지"` 또는 `node src/entry.js` (usage 확인)
- **웹 서버**: `web-server.js`를 직접 호출해야 함. `npm run web`(= `node src/entry.js web`)은 함수명 불일치(`runWebServer` vs `startWebServer`) 때문에 실패함. 대안: `node -e "import('./src/web-server.js').then(m => m.startWebServer())"` — port 3000에서 실행됨.
- **테스트**: `npm test` — Node.js 내장 테스트 러너 사용, 22개 테스트.
- **린트**: ESLint 등 별도 린트 설정 없음.

### API 키 요구사항
LLM 기능을 사용하려면 `OPENAI_API_KEY`, `XAI_API_KEY`, 또는 `GROQ_API_KEY` 중 하나가 환경변수로 설정되어야 함. API 키 없이도 CLI usage, 웹 UI 로딩, 테스트는 정상 동작함.

### 알려진 이슈
- `entry.js`가 `runWebServer`를 import하지만 `web-server.js`는 `startWebServer`를 export함. `npm run web` 실행 시 `runWebServer is not a function` 오류 발생.
