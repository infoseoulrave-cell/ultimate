# 다른 컴퓨터로 옮기기

다른 PC에서 이 프로젝트를 그대로 쓰려면 아래 둘 중 하나만 하면 된다.

---

## 방법 1: Git 사용 (추천)

**지금 컴퓨터**
1. GitHub/GitLab 등에 저장소 만들고 연결 (이미 되어 있으면 생략)
2. 커밋 후 푸시:
   ```bash
   cd /Users/minho/ultimate
   git add .
   git commit -m "backup for migrate"
   git push origin main
   ```

**다른 컴퓨터**
1. Node.js 22+ 설치 (`node -v` 확인)
2. 클론:
   ```bash
   git clone https://github.com/당신계정/ultimate.git
   cd ultimate
   ```
3. 의존성 설치:
   ```bash
   npm install
   ```
4. 설정만 옮기기:
   - API 키: 새 PC에서 `~/.ultimate/config.json` 만들거나 `.env` 복사
   - 또는 `cp -r ~/.ultimate ~/다른PC홈/.ultimate` (이전 PC에서 폴더 통째로 복사해 둔 경우)

이후 실행:
```bash
node src/entry.js chat
# 또는 npm run electron-dev 등
```

---

## 방법 2: 폴더 통째로 복사 (Git 없을 때)

**지금 컴퓨터**
1. `node_modules` 빼고 압축 (용량·호환 때문에):
   ```bash
   cd /Users/minho
   zip -r ultimate.zip ultimate -x "ultimate/node_modules/*" "ultimate/.ultimate/*" "ultimate/.env" "ultimate/.git/*"
   ```
   또는 Finder에서 `ultimate` 폴더 복사 후 `node_modules` 폴더만 삭제하고 압축해도 됨.
2. `ultimate.zip`을 USB/클라우드로 다른 컴퓨터에 전달.

**다른 컴퓨터**
1. Node.js 22+ 설치
2. 압축 풀기 후 폴더로 이동:
   ```bash
   unzip ultimate.zip
   cd ultimate
   ```
3. 의존성 설치:
   ```bash
   npm install
   ```
4. 설정:
   - API 키 등: `~/.ultimate/config.json` 또는 `.env`를 새로 만들거나, 예전 PC에서 `~/.ultimate` 폴더를 복사해 둔 걸 붙여넣기.

실행:
```bash
node src/entry.js chat
```

---

## 꼭 옮겨야 하는 것

| 항목 | 어디에 | 비고 |
|------|--------|------|
| 소스 코드 | `ultimate/` 전체 (단, `node_modules` 제외) | Git 또는 zip으로 |
| API 키 | `~/.ultimate/config.json` 또는 `.env` | 직접 입력하거나 파일 복사 |
| 기타 설정 | `~/.ultimate/` | evolution 패치, 로그 등 원하면 복사 |

`node_modules`는 새 PC에서 `npm install`로 다시 받는 게 좋다 (OS/아키텍처 맞추려고).
