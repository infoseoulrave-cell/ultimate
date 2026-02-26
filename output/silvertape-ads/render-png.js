import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import puppeteer from 'puppeteer';

const BASE = import.meta.dirname || '.';
const HTML_DIR = join(BASE, 'html-photo');
const PNG_DIR = join(BASE, 'png');
mkdirSync(HTML_DIR, { recursive: true });
mkdirSync(PNG_DIR, { recursive: true });

const PHOTOS = resolve(BASE, 'photos');

function imgToBase64(filename) {
  const p = join(PHOTOS, filename);
  if (!existsSync(p)) return '';
  const buf = readFileSync(p);
  const ext = filename.endsWith('.png') ? 'png' : 'jpeg';
  return `data:image/${ext};base64,${buf.toString('base64')}`;
}

const cards = [
  { num: 1, img: 'hero-neon-flamingo.png', pos: 'center', headline: '모든 벽에\n예술을.', sub: 'Every wall deserves a sensation.', body: '미술관에서만 예술을 만날 필요는 없다.\n당신이 매일 마주하는 벽이 캔버스가 되는 순간.', cta: 'silvertape.art', cat: 'BRAND', accent: '#fff' },
  { num: 2, img: 'hero-monument.png', pos: 'center', headline: 'Tape Art\nto Your Wall.', sub: '실버 테이프처럼 단단하게.', body: '각기 다른 시선을 가진 스튜디오들이 큐레이션한 작품을\n프리미엄 프린트라는 물성 위에 올려 당신의 벽에 고정한다.', cta: '지금 컬렉션 보기 →', cat: 'BRAND', accent: '#C0C0C0' },
  { num: 3, img: 'artsy-001-poster-black.jpg', pos: 'right', headline: '한정판은\n한 번 품절되면\n끝입니다.', sub: 'Limited Edition', body: '각 작품은 제한된 수량으로만 프린트됩니다.\n소장 가치가 있는 예술, 지금이 아니면 없습니다.', cta: '한정판 보러가기 →', cat: 'BRAND', accent: '#E8D5B7' },
  { num: 4, img: 'strip-1.jpg', pos: 'center', headline: '5만원 이상\n무료배송', sub: 'Free shipping over ₩50,000', body: '전국 어디든, 안전한 튜브 포장으로\n작품을 그대로 전달합니다.\n프리미엄 포장 · 빠른 배송.', cta: 'silvertape.art', cat: 'BRAND', accent: '#FF6B6B' },
  { num: 5, img: 'strip-2.jpg', pos: 'center', headline: '감각은\n설명할 수 없지만\n분명히 존재한다.', sub: 'Art stops your step.', body: '걸음을 멈추게 하는 한 장의 그림,\n무심히 벽에 걸어두었는데\n어느 날 문득 눈이 가는 포스터.', cta: 'SILVERTAPE', cat: 'BRAND', accent: '#4ECDC4' },
  { num: 6, img: 'hero-neon-flamingo.png', pos: 'right', headline: 'HANGOVER\nSTUDIO', sub: 'Cyberpunk × Nature', body: '네온 불빛 아래 피어나는 자연.\n도시의 그리드 속 유기적 생명력.\n디지털과 아날로그의 경계를 녹인다.', cta: 'Neon Flamingo · Impasto Emotion →', cat: 'STUDIO', accent: '#FF00FF' },
  { num: 7, img: 'sens-006-art.png', pos: 'right', headline: 'VOID.\nSTUDIO', sub: 'The beauty of absence', body: '아무것도 없는 곳에서 시작되는 예술.\n여백이 말하는 것,\n침묵이 들려주는 것.', cta: 'VOID. 컬렉션 보기 →', cat: 'STUDIO', accent: '#FFFFFF' },
  { num: 8, img: 'sens-011-art.jpg', pos: 'right', headline: 'SENSIBILITY\nSTAIR', sub: '감각의 계단', body: '색채와 질감으로 쌓아 올린 감각의 층위.\nHelvetica Strike · Red Carpet Repose ·\nData Aisle · Mint Essence', cta: '전체 작품 보기 →', cat: 'STUDIO', accent: '#FF4444' },
  { num: 9, img: 'artsy-002-poster-black.jpg', pos: 'right', headline: 'Top Shelf', sub: "This Week's High", body: '매주 업데이트되는 기대작.\n가장 많은 시선이 머문 작품들.\n당신의 선택을 기다리고 있습니다.', cta: 'TOP SHELF 보기 →', cat: 'STUDIO', accent: '#FFD700' },
  { num: 10, img: 'artsy-001-poster-black.jpg', pos: 'right', headline: 'Impasto\nEmotion', sub: 'HANGOVER — fine art', body: '물감이 튀어나올 것 같은 질감.\n디지털이 만든 임파스토의 감정.\n₩112,000 · 프리미엄 프린트', cta: '작품 상세보기 →', cat: 'PRODUCT', accent: '#FF9500' },
  { num: 11, img: 'hero-neon-flamingo.png', pos: 'right', headline: 'Neon\nFlamingo', sub: 'HANGOVER — Cyberpunk', body: '사이버펑크가 자연과 만나는 곳.\n빗물 웅덩이에 핑크 빛이 반사된다.\n₩112,000 · 한정판', cta: '소장하기 →', cat: 'PRODUCT', accent: '#00FFAA' },
  { num: 12, img: 'strip-3.jpg', pos: 'center', headline: '거실이\n갤러리가\n되는 순간.', sub: 'Your living room, reimagined.', body: '소파 위 빈 벽.\n거기에 한 장의 포스터가 놓이면\n공간의 온도가 달라진다.', cta: 'silvertape.art', cat: 'LIFESTYLE', accent: '#B8860B' },
  { num: 13, img: 'strip-4.jpg', pos: 'center', headline: '작업실에\n영감을\n걸어두세요.', sub: 'Surround yourself with inspiration.', body: '매일 마주하는 시선 안에\n영감의 원천을 배치하세요.\n크리에이터를 위한 공간 큐레이션.', cta: '크리에이터 추천 →', cat: 'LIFESTYLE', accent: '#E6E6FA' },
  { num: 14, img: 'sens-012-art.jpg', pos: 'right', headline: '선물하기\n가장 좋은\n예술.', sub: 'The perfect gift.', body: '꽃은 시들고, 케이크는 사라지지만\n벽 위의 예술은 매일 남습니다.\n생일 · 집들이 · 기념일.', cta: '선물 추천 보기 →', cat: 'LIFESTYLE', accent: '#FF6B9D' },
  { num: 15, img: 'strip-5.jpg', pos: 'center', headline: '카페 사장님,\n벽이 비어\n있습니다.', sub: 'For cafés & studios.', body: '상업 공간의 분위기는\n벽 위의 한 장이 결정합니다.\nB2B 대량 주문 · 공간 컨설팅 가능.', cta: '문의하기 →', cat: 'LIFESTYLE', accent: '#87CEEB' },
  { num: 16, img: 'strip-6.jpg', pos: 'center', headline: '원룸도\n갤러리가\n될 수 있다.', sub: 'Small space, big impact.', body: '작은 공간일수록\n벽 위의 예술이 빛난다.\nA3 사이즈부터 시작하세요.', cta: '소형 프린트 보기 →', cat: 'LIFESTYLE', accent: '#DDA0DD' },
  { num: 17, img: 'strip-7.jpg', pos: 'center', headline: '프레임 없이\n테이프로\n붙여보세요.', sub: 'No frame needed.', body: '마스킹 테이프, 워싱 테이프,\n혹은 실버 테이프.\n규칙 없이, 자유롭게.', cta: '#테이프인테리어', cat: 'LIFESTYLE', accent: '#98FB98' },
  { num: 18, img: 'sens-009-art.png', pos: 'right', headline: 'NEW\nDROP', sub: 'VOID. 스튜디오 신작 공개', body: '새로운 시선, 새로운 여백.\nVOID. 스튜디오의 최신 컬렉션이\n지금 공개됩니다.', cta: '지금 보러가기 →', cat: 'PROMO', accent: '#FF4500' },
  { num: 19, img: 'sens-004-art.png', pos: 'right', headline: 'EXCLUSIVE\n단독 작품', sub: 'SILVERTAPE에서만', body: '다른 곳에서는 구할 수 없습니다.\nSILVERTAPE 단독 큐레이션.\nExclusive 마크를 확인하세요.', cta: 'Exclusive 컬렉션 →', cat: 'PROMO', accent: '#FFD700' },
  { num: 20, img: 'strip-8.jpg', pos: 'center', headline: '첫 구매\n할인', sub: 'Welcome to SILVERTAPE', body: '처음 오신 분들을 위한 특별 혜택.\n뉴스레터 구독 시\n첫 주문 10% 할인.', cta: '지금 구독하기 →', cat: 'PROMO', accent: '#00CED1' },
  { num: 21, img: 'sens-013-art.jpg', pos: 'right', headline: '2장 이상\n구매 시\n추가 할인', sub: 'Bundle & Save', body: '포스터는 하나보다 둘이,\n둘보다 셋이 낫습니다.\n갤러리 월을 완성하세요.', cta: '번들 혜택 보기 →', cat: 'PROMO', accent: '#FF69B4' },
  { num: 22, img: 'sens-010-art.jpg', pos: 'right', headline: 'RESTOCK\nALERT', sub: '품절작 복귀', body: '요청이 많았던 작품이 돌아왔습니다.\n이번에도 한정 수량.\n놓치지 마세요.', cta: '재입고 작품 보기 →', cat: 'PROMO', accent: '#9370DB' },
  { num: 23, img: 'blk-001-poster-black.jpg', pos: 'right', headline: '주간 큐레이션\n에디터 PICK', sub: "Editor's Choice", body: '수십 개 작품 중\n에디터가 직접 고른 한 장.\n매주 월요일 업데이트.', cta: '에디터 PICK 보기 →', cat: 'PROMO', accent: '#F0E68C' },
  { num: 24, img: 'pop-001-poster-black.jpg', pos: 'right', headline: '좋은 포스터를\n고르는 법', sub: 'How to Choose Art', body: '① 공간 톤과 어울리는 색감\n② 시선이 머무는 구도\n③ 오래 봐도 질리지 않는 주제\n④ 프린트 품질 확인\n⑤ 직감을 믿으세요', cta: '큐레이션 둘러보기 →', cat: 'CONTENT', accent: '#FF8C00' },
  { num: 25, img: 'fun-002-poster-black.jpg', pos: 'right', headline: '포스터\n사이즈\n가이드', sub: 'Size Guide', body: 'A4 (21×30cm): 책상 위\nA3 (30×42cm): 원룸 벽\nA2 (42×59cm): 거실 벽\nA1 (59×84cm): 대형 공간', cta: '사이즈별 작품 보기 →', cat: 'CONTENT', accent: '#20B2AA' },
  { num: 26, img: 'sens-003-art.png', pos: 'right', headline: 'AI 아트는\n예술인가?', sub: 'AI × Art', body: '카텔란의 바나나가 예술이 되었듯이,\nAI가 만든 이미지도 예술이 될 수 있다.\n중요한 건 도구가 아니라 감각이다.', cta: 'AI 아트 컬렉션 →', cat: 'CONTENT', accent: '#DA70D6' },
  { num: 27, img: 'sens-007-art.png', pos: 'right', headline: '포스터\n걸기 팁', sub: 'How to Hang', body: '눈높이 약간 아래 (150cm)\n가구와 15~25cm 간격\n복수 작품: 중심축 맞추기\n조명은 위에서 비추기', cta: '#포스터걸기팁', cat: 'CONTENT', accent: '#F4A460' },
  { num: 28, img: 'sens-008-art.png', pos: 'right', headline: '컬러로\n분위기\n바꾸기', sub: 'Color Mood', body: '따뜻한 톤: 아늑함, 편안함\n차가운 톤: 세련됨, 집중\n모노톤: 고급스러움\n비비드: 에너지, 개성', cta: '컬러별 작품 보기 →', cat: 'CONTENT', accent: '#00FA9A' },
  { num: 29, img: 'sens-006-art.png', pos: 'right', headline: 'Helvetica\nStrike', sub: 'SENSIBILITY — Exclusive', body: '타이포그래피가 예술이 되는 순간.\n헬베티카의 정밀함과 파괴적 에너지의 충돌.\n₩112,000 · Exclusive', cta: '작품 상세보기 →', cat: 'PRODUCT', accent: '#C0C0C0' },
  { num: 30, img: 'hero-monument.png', pos: 'center', headline: 'SILVER\nTAPE', sub: 'Curated Art. Every Wall.', body: '당신의 벽 위에,\n단단하게 고정합니다.\n\nsilvertape.art', cta: 'Follow @silvertape.art', cat: 'BRAND', accent: '#C0C0C0' },
];

function buildHtml(c) {
  const b64 = imgToBase64(c.img);
  const lines = c.headline.split('\n');
  const bodyLines = c.body.split('\n');
  const num = String(c.num).padStart(2, '0');

  const isFullBg = c.pos === 'center';
  const layout = isFullBg ? `
    .bg { position: absolute; inset: 0; background: url('${b64}') center/cover no-repeat; }
    .overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.75) 100%); }
    .content { position: relative; z-index: 2; }
  ` : `
    .bg { position: absolute; right: 0; top: 0; width: 50%; height: 100%; background: url('${b64}') center/cover no-repeat; }
    .bg::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, #0a0a0a 0%, rgba(10,10,10,0.3) 60%, rgba(10,10,10,0.1) 100%); }
    .overlay { display: none; }
    .content { position: relative; z-index: 2; width: 58%; }
  `;

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;700;900&family=Space+Grotesk:wght@400;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1080px; height: 1080px; background: #0a0a0a; color: #fff; font-family: 'Noto Sans KR', sans-serif; overflow: hidden; position: relative; }
  ${layout}
  .inner { padding: 60px 64px; display: flex; flex-direction: column; height: 100%; }
  .top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
  .logo { font-family: 'Space Grotesk', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 4px; color: rgba(255,255,255,0.6); }
  .cat { font-size: 11px; font-weight: 700; letter-spacing: 3px; color: ${c.accent}; }
  .headline { font-size: 64px; font-weight: 900; line-height: 1.08; letter-spacing: -2px; margin-bottom: 16px; text-shadow: 0 2px 20px rgba(0,0,0,0.5); }
  .headline .a { color: ${c.accent}; }
  .sub { font-size: 17px; font-weight: 300; color: rgba(255,255,255,0.55); margin-bottom: 40px; letter-spacing: 0.5px; }
  .body { font-size: 19px; font-weight: 300; line-height: 1.75; color: rgba(255,255,255,0.8); flex: 1; }
  .bottom { margin-top: auto; padding-top: 28px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center; }
  .cta { font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 700; color: ${c.accent}; }
  .num { font-size: 12px; color: rgba(255,255,255,0.25); }
</style></head>
<body>
  <div class="bg"></div>
  <div class="overlay"></div>
  <div class="content">
    <div class="inner">
      <div class="top"><span class="logo">SILVERTAPE</span><span class="cat">${c.cat}</span></div>
      <div class="headline">${lines.map((l, i) => i === 0 ? `<span class="a">${l}</span>` : l).join('<br>')}</div>
      <div class="sub">${c.sub}</div>
      <div class="body">${bodyLines.join('<br>')}</div>
      <div class="bottom"><span class="cta">${c.cta}</span><span class="num">${num} / 30</span></div>
    </div>
  </div>
</body></html>`;
}

console.log('Generating HTML files...');
for (const c of cards) {
  const num = String(c.num).padStart(2, '0');
  writeFileSync(join(HTML_DIR, `${num}.html`), buildHtml(c));
}

console.log('Launching Puppeteer to render PNGs...');
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });

for (const c of cards) {
  const num = String(c.num).padStart(2, '0');
  const htmlPath = `file://${resolve(HTML_DIR, `${num}.html`)}`;
  await page.goto(htmlPath, { waitUntil: 'networkidle0', timeout: 15000 }).catch(() => page.goto(htmlPath, { waitUntil: 'load' }));
  await new Promise(r => setTimeout(r, 500));
  const outPath = join(PNG_DIR, `silvertape-${num}.png`);
  await page.screenshot({ path: outPath, type: 'png', clip: { x: 0, y: 0, width: 1080, height: 1080 } });
  console.log(`  ✅ ${outPath}`);
}

await browser.close();
console.log(`\n🎉 Done! ${cards.length} PNG files saved to: output/silvertape-ads/png/`);
