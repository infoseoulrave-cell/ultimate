import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import puppeteer from 'puppeteer';

const BASE = import.meta.dirname || '.';
const HTML_DIR = join(BASE, 'html-v2');
const PNG_DIR = join(BASE, 'png-v2');
mkdirSync(HTML_DIR, { recursive: true });
mkdirSync(PNG_DIR, { recursive: true });
const PHOTOS = resolve(BASE, 'photos');

function b64(filename) {
  const p = join(PHOTOS, filename);
  if (!existsSync(p)) { console.warn('  ⚠ Missing:', filename); return ''; }
  const buf = readFileSync(p);
  const ext = filename.endsWith('.png') ? 'png' : filename.endsWith('.webp') ? 'webp' : 'jpeg';
  return `data:image/${ext};base64,${buf.toString('base64')}`;
}

const cards = [
  // BRAND
  { num:1, img:'sens-001-art.png', layout:'full', cat:'BRAND', accent:'#fff',
    h:'모든 벽에\n예술을.', sub:'Every wall deserves a sensation.', body:'미술관에서만 예술을 만날 필요는 없다.\n당신이 매일 마주하는 벽이\n캔버스가 되는 순간.', cta:'silver-tape.com',
    cap:'예술은 미술관 밖에도 있다.\n\n매일 지나치는 벽, 매일 마주하는 공간.\n거기에 한 장의 포스터가 놓이면 일상이 달라진다.\n\nSILVERTAPE — 모든 벽에 예술을.\n\n🔗 silver-tape.com\n\n#SILVERTAPE #아트포스터 #인테리어아트 #큐레이션 #벽장식 #아트프린트 #포스터추천 #공간디자인' },
  { num:2, img:'hero-monument.png', layout:'full', cat:'BRAND', accent:'#C0C0C0',
    h:'Tape Art\nto Your Wall.', sub:'실버 테이프처럼 단단하게.', body:'큐레이션 스튜디오가 엄선한\n프리미엄 아트 프린트.\n당신의 공간을 갤러리로.', cta:'지금 컬렉션 보기 →',
    cap:'Tape Art to Your Wall.\n\n큐레이션 스튜디오가 엄선한 프리미엄 아트 프린트.\n당신의 공간을 갤러리로 만들어 드립니다.\n\n🔗 silver-tape.com\n\n#SILVERTAPE #아트큐레이션 #프리미엄프린트 #인테리어 #감성인테리어' },
  { num:3, img:'artsy-001-poster-black.jpg', layout:'split', cat:'BRAND', accent:'#E8D5B7',
    h:'한정판은\n한 번 품절되면\n끝입니다.', sub:'Limited Edition', body:'각 작품은 제한된 수량으로만 프린트됩니다.\n소장 가치가 있는 예술,\n지금이 아니면 없습니다.', cta:'한정판 보러가기 →',
    cap:'⚠️ 한정판은 한 번 품절되면 끝입니다.\n\n대량 생산이 아닌, 소장 가치가 있는 예술.\n지금이 아니면 없습니다.\n\n🔗 silver-tape.com\n\n#한정판 #LimitedEdition #아트포스터 #소장가치 #SILVERTAPE' },
  { num:4, img:'strip-1.jpg', layout:'full', cat:'BRAND', accent:'#FF6B6B',
    h:'5만원 이상\n무료배송', sub:'Free shipping over ₩50,000', body:'전국 어디든, 안전한 튜브 포장으로\n작품을 그대로 전달합니다.', cta:'silver-tape.com',
    cap:'📦 5만원 이상 무료배송\n\n프리미엄 튜브 포장으로 안전하게.\n\n🔗 silver-tape.com\n\n#무료배송 #SILVERTAPE #아트포스터 #프리미엄포장' },
  { num:5, img:'strip-2.jpg', layout:'full', cat:'BRAND', accent:'#4ECDC4',
    h:'감각은\n설명할 수 없지만\n분명히 존재한다.', sub:'Art stops your step.', body:'걸음을 멈추게 하는 한 장의 그림.\n그 감각을 전하기 위해.', cta:'SILVERTAPE',
    cap:'감각은 설명할 수 없지만 분명히 존재한다.\n\nSILVERTAPE는 그 감각을 전합니다.\n\n🔗 silver-tape.com\n\n#SILVERTAPE #감성아트 #아트포스터 #감각적인공간' },
  // STUDIO — PHANTOM REEL (NEW)
  { num:6, img:'phr-007-art.jpg', layout:'split', cat:'NEW STUDIO', accent:'#00FF88',
    h:'PHANTOM\nREEL', sub:'새로운 스튜디오 오픈', body:'필름 노이즈와 디지털 잔상.\n존재했지만 사라진 장면들을\n다시 불러오는 스튜디오.', cta:'PHANTOM REEL 보러가기 →',
    cap:'🎬 NEW STUDIO — PHANTOM REEL\n\n필름 노이즈와 디지털 잔상.\n존재했지만 사라진 장면들을 다시 불러오는 스튜디오.\n\n🔗 silver-tape.com/studio/phantom-reel\n\n#PHANTOMREEL #SILVERTAPE #신규스튜디오 #아트포스터 #필름아트' },
  { num:7, img:'phr-004-art.jpg', layout:'split', cat:'EXCLUSIVE', accent:'#FFD700',
    h:'Eagle Has\nLanded', sub:'PHANTOM REEL — Exclusive', body:'독수리가 착륙한 순간.\n거친 질감과 긴장감.\nSILVERTAPE 단독. ₩112,000~', cta:'소장하기 →',
    cap:'🦅 Eagle Has Landed\nby PHANTOM REEL — Exclusive\n\n거친 질감과 긴장감이 공존하는 한 장.\nSILVERTAPE 단독.\n\n₩112,000~\n\n🔗 silver-tape.com/studio/phantom-reel/eagle-has-landed\n\n#EagleHasLanded #PHANTOMREEL #Exclusive #SILVERTAPE #아트포스터' },
  { num:8, img:'phr-008-art.jpg', layout:'split', cat:'PRODUCT', accent:'#FF4444',
    h:'Last\nStop', sub:'PHANTOM REEL', body:'마지막 정거장.\n아무도 내리지 않는 역.\n₩112,000~', cta:'작품 보기 →',
    cap:'🚉 Last Stop\nby PHANTOM REEL\n\n마지막 정거장. 아무도 내리지 않는 역.\n\n₩112,000~\n\n🔗 silver-tape.com/studio/phantom-reel/last-stop\n\n#LastStop #PHANTOMREEL #SILVERTAPE #아트포스터' },
  { num:9, img:'phr-010-art.jpg', layout:'split', cat:'PRODUCT', accent:'#C0C0C0',
    h:'Silver\nWrap', sub:'PHANTOM REEL', body:'은빛으로 감싼 순간.\n차갑지만 따뜻한 금속의 온도.\n₩112,000~', cta:'작품 보기 →',
    cap:'✨ Silver Wrap\nby PHANTOM REEL\n\n은빛으로 감싼 순간.\n\n₩112,000~\n\n🔗 silver-tape.com/studio/phantom-reel/silver-wrap\n\n#SilverWrap #PHANTOMREEL #SILVERTAPE #아트포스터' },
  { num:10, img:'phr-009-art.jpg', layout:'split', cat:'PRODUCT', accent:'#8B4513',
    h:'Pinned\nDark', sub:'PHANTOM REEL', body:'어둠에 고정된 것들.\n보이지 않지만 존재하는.\n₩112,000~', cta:'작품 보기 →',
    cap:'📌 Pinned Dark\nby PHANTOM REEL\n\n어둠에 고정된 것들.\n보이지 않지만 존재하는.\n\n₩112,000~\n\n🔗 silver-tape.com/studio/phantom-reel/pinned-dark\n\n#PinnedDark #PHANTOMREEL #SILVERTAPE #아트포스터' },
  // STUDIO — SENSIBILITY STAIR
  { num:11, img:'sens-001-art.png', layout:'split', cat:'STUDIO', accent:'#FF6347',
    h:'Irrational\nTable', sub:'SENSIBILITY STAIR — 초현실적 정물', body:'가만히 있기를 거부하는 오브제.\n모든 것이 서로를 모순한다\n— 그것이 요점이다.', cta:'작품 보기 →',
    cap:'🍽 Irrational Table\nby SENSIBILITY STAIR\n\n가만히 있기를 거부하는 초현실적 정물.\n모든 오브제가 서로를 모순한다 — 그것이 요점이다.\n\n🔗 silver-tape.com/studio/sensibility\n\n#IrrationalTable #SENSIBILITY #SILVERTAPE #초현실 #아트포스터' },
  { num:12, img:'sens-006-art.png', layout:'split', cat:'EXCLUSIVE', accent:'#FFD700',
    h:'Helvetica\nStrike', sub:'SENSIBILITY — Exclusive', body:'타이포그래피가 예술이 되는 순간.\n헬베티카의 정밀함과\n파괴적 에너지의 충돌.\n₩112,000~', cta:'소장하기 →',
    cap:'🔤 Helvetica Strike — Exclusive\nby SENSIBILITY STAIR\n\n₩112,000~\n\n🔗 silver-tape.com/studio/sensibility/helvetica-strike\n\n#HelveticaStrike #SENSIBILITY #Exclusive #SILVERTAPE #타이포아트' },
  { num:13, img:'sens-009-art.png', layout:'split', cat:'EXCLUSIVE', accent:'#FFD700',
    h:'Data\nAisle', sub:'SENSIBILITY — Exclusive', body:'데이터가 걷는 통로.\n정보의 홍수 속 질서와 혼돈.\n₩112,000~', cta:'소장하기 →',
    cap:'💾 Data Aisle — Exclusive\nby SENSIBILITY STAIR\n\n₩112,000~\n\n🔗 silver-tape.com/studio/sensibility/data-aisle\n\n#DataAisle #SENSIBILITY #Exclusive #SILVERTAPE #디지털아트' },
  // STUDIO — HANGOVER
  { num:14, img:'hero-neon-flamingo.png', layout:'split', cat:'STUDIO', accent:'#FF00FF',
    h:'HANGOVER\nSTUDIO', sub:'Cyberpunk × Nature', body:'네온 불빛 아래 피어나는 자연.\n도시의 그리드 속 유기적 생명력.', cta:'HANGOVER 컬렉션 →',
    cap:'🔥 HANGOVER STUDIO\nCyberpunk × Nature\n\n네온 불빛 아래 피어나는 자연.\n\n🔗 silver-tape.com/studios\n\n#HANGOVER #사이버펑크아트 #SILVERTAPE #아트포스터' },
  { num:15, img:'artsy-001-poster-black.jpg', layout:'split', cat:'PRODUCT', accent:'#FF9500',
    h:'Impasto\nEmotion', sub:'HANGOVER — fine art', body:'물감이 튀어나올 것 같은 질감.\n디지털이 만든 임파스토의 감정.\n₩112,000~', cta:'작품 상세보기 →',
    cap:'🖼 Impasto Emotion\nby HANGOVER\n\n₩112,000~\n\n🔗 silver-tape.com/studio/hangover/impasto-emotion\n\n#ImpastoEmotion #HANGOVER #SILVERTAPE #파인아트' },
  // LIFESTYLE
  { num:16, img:'strip-3.jpg', layout:'full', cat:'LIFESTYLE', accent:'#B8860B',
    h:'거실이\n갤러리가\n되는 순간.', sub:'Your living room, reimagined.', body:'소파 위 빈 벽.\n한 장의 포스터가 놓이면\n공간의 온도가 달라진다.', cta:'silver-tape.com',
    cap:'🏠 거실이 갤러리가 되는 순간.\n\n소파 위 빈 벽에 한 장의 포스터.\n공간의 온도가 달라집니다.\n\n🔗 silver-tape.com\n\n#거실인테리어 #아트포스터 #SILVERTAPE #공간꾸미기' },
  { num:17, img:'strip-4.jpg', layout:'full', cat:'LIFESTYLE', accent:'#E6E6FA',
    h:'작업실에\n영감을\n걸어두세요.', sub:'Surround yourself with inspiration.', body:'매일 마주하는 시선 안에\n영감의 원천을 배치하세요.', cta:'크리에이터 추천 →',
    cap:'💻 작업실에 영감을 걸어두세요.\n\n🔗 silver-tape.com\n\n#작업실인테리어 #영감 #크리에이터 #SILVERTAPE' },
  { num:18, img:'sens-012-art.jpg', layout:'split', cat:'LIFESTYLE', accent:'#FF6B9D',
    h:'선물하기\n가장 좋은\n예술.', sub:'Art that stays.', body:'꽃은 시들고 케이크는 사라지지만\n벽 위의 예술은 매일 남습니다.', cta:'선물 추천 보기 →',
    cap:'🎁 선물하기 가장 좋은 예술.\n\n꽃은 시들지만, 벽 위의 예술은 매일 남습니다.\n\n🔗 silver-tape.com\n\n#선물추천 #집들이선물 #아트포스터 #SILVERTAPE' },
  { num:19, img:'strip-5.jpg', layout:'full', cat:'LIFESTYLE', accent:'#87CEEB',
    h:'카페 사장님,\n벽이 비어\n있습니다.', sub:'For cafés & studios.', body:'상업 공간의 분위기는\n벽 위의 한 장이 결정합니다.\nB2B 대량 주문 가능.', cta:'문의: hello@silvertape.art',
    cap:'☕ 카페 사장님, 벽이 비어 있습니다.\n\nB2B 대량 주문 · 공간 컨설팅 가능.\n📧 hello@silvertape.art\n\n🔗 silver-tape.com\n\n#카페인테리어 #상업공간 #SILVERTAPE #아트포스터' },
  { num:20, img:'strip-6.jpg', layout:'full', cat:'LIFESTYLE', accent:'#DDA0DD',
    h:'원룸도\n갤러리가\n될 수 있다.', sub:'Small space, big impact.', body:'작은 공간일수록 빛나는 예술.\nA3 사이즈부터.', cta:'소형 프린트 보기 →',
    cap:'🏙 원룸도 갤러리가 될 수 있다.\n\n🔗 silver-tape.com\n\n#원룸인테리어 #자취방꾸미기 #SILVERTAPE #아트포스터' },
  // PROMO
  { num:21, img:'phr-006-art.jpg', layout:'split', cat:'NEW DROP', accent:'#FF4500',
    h:'PHANTOM REEL\n신작 공개', sub:'Station Drift · Module Seven · Pump Seven', body:'필름 노이즈와 디지털 잔상.\n새로운 스튜디오의 전 작품이\n지금 공개됩니다.', cta:'지금 보러가기 →',
    cap:'🔔 NEW DROP — PHANTOM REEL 전 작품 공개\n\nStation Drift, Module Seven, Pump Seven...\n새로운 스튜디오의 전 작품을 만나보세요.\n\n🔗 silver-tape.com/studio/phantom-reel\n\n#NewDrop #PHANTOMREEL #SILVERTAPE #신작공개' },
  { num:22, img:'phr-005-art.jpg', layout:'split', cat:'EXCLUSIVE', accent:'#FFD700',
    h:'EXCLUSIVE\n단독 작품', sub:'silver-tape.com에서만', body:'다른 곳에서는 구할 수 없습니다.\nExclusive 마크가 붙은 작품은\n오직 SILVERTAPE 단독.', cta:'Exclusive 보기 →',
    cap:'⭐ EXCLUSIVE — 단독 작품\n\nsilver-tape.com에서만 만날 수 있습니다.\n\n🔗 silver-tape.com/shop\n\n#Exclusive #단독작품 #SILVERTAPE #소장가치' },
  { num:23, img:'strip-8.jpg', layout:'full', cat:'PROMO', accent:'#00CED1',
    h:'첫 구매\n10% 할인', sub:'뉴스레터 구독 혜택', body:'뉴스레터 구독 시\n첫 주문 10% 할인.\n신작 소식을 가장 먼저.', cta:'지금 구독하기 →',
    cap:'🎉 첫 구매 10% 할인\n\n뉴스레터 구독 시 첫 주문 10% 할인.\n신작 소식도 가장 먼저!\n\n🔗 silver-tape.com\n\n#첫구매할인 #SILVERTAPE #웰컴혜택' },
  { num:24, img:'sens-013-art.jpg', layout:'split', cat:'PROMO', accent:'#FF69B4',
    h:'2장 이상\n추가 할인', sub:'Bundle & Save', body:'벽을 채울수록 이득.\n나만의 갤러리 월을 완성하세요.', cta:'번들 혜택 보기 →',
    cap:'🖼🖼 2장 이상 추가 할인\n\n갤러리 월을 완성하세요.\n\n🔗 silver-tape.com/shop\n\n#번들할인 #갤러리월 #SILVERTAPE' },
  // CONTENT
  { num:25, img:'pop-001-poster-black.jpg', layout:'split', cat:'GUIDE', accent:'#FF8C00',
    h:'좋은 포스터를\n고르는 법', sub:'5가지 기준', body:'① 공간 톤과 어울리는 색감\n② 시선이 머무는 구도\n③ 질리지 않는 주제\n④ 프린트 품질 확인\n⑤ 직감을 믿으세요', cta:'큐레이션 둘러보기 →',
    cap:'🎯 좋은 포스터를 고르는 법\n\n① 색감 ② 구도 ③ 주제 ④ 품질 ⑤ 직감\n\n🔗 silver-tape.com/shop\n\n#포스터고르는법 #SILVERTAPE #인테리어팁' },
  { num:26, img:'fun-002-poster-black.jpg', layout:'split', cat:'GUIDE', accent:'#20B2AA',
    h:'포스터\n사이즈\n가이드', sub:'어떤 크기가 맞을까?', body:'A4: 책상 위\nA3: 원룸 벽\nA2: 거실·침실\nA1: 대형 공간', cta:'사이즈별 보기 →',
    cap:'📏 포스터 사이즈 가이드\n\n🔗 silver-tape.com/shop\n\n#사이즈가이드 #SILVERTAPE #인테리어팁' },
  { num:27, img:'sens-003-art.png', layout:'split', cat:'CONTENT', accent:'#DA70D6',
    h:'AI 아트는\n예술인가?', sub:'도구인가, 예술가인가?', body:'중요한 건 도구가 아니라 감각.\nSILVERTAPE의 스튜디오들은\nAI를 도구로 쓰되 감각으로 큐레이션.', cta:'AI 아트 컬렉션 →',
    cap:'🤖 AI 아트는 예술인가?\n\n중요한 건 도구가 아니라 감각.\n\n🔗 silver-tape.com\n\n#AI아트 #SILVERTAPE #현대미술' },
  { num:28, img:'sens-008-art.png', layout:'split', cat:'GUIDE', accent:'#00FA9A',
    h:'컬러로\n분위기\n바꾸기', sub:'Color Mood', body:'🔴 따뜻한 톤 → 아늑함\n🔵 차가운 톤 → 세련됨\n⬛ 모노톤 → 고급스러움\n🟡 비비드 → 에너지', cta:'컬러별 작품 →',
    cap:'🎨 컬러로 분위기 바꾸기\n\n🔗 silver-tape.com/shop\n\n#컬러무드 #SILVERTAPE #인테리어컬러' },
  { num:29, img:'sens-007-art.png', layout:'split', cat:'GUIDE', accent:'#F4A460',
    h:'포스터\n걸기 팁', sub:'프로처럼 걸기', body:'눈높이 약간 아래 (150cm)\n가구와 15~25cm 간격\n복수 작품: 중심축 맞추기\n조명은 위에서', cta:'#포스터걸기팁',
    cap:'🔨 포스터 프로처럼 걸기\n\n🔗 silver-tape.com\n\n#포스터걸기팁 #SILVERTAPE #인테리어팁' },
  // CLOSING
  { num:30, img:'hero-monument.png', layout:'full', cat:'SILVERTAPE', accent:'#C0C0C0',
    h:'SILVER\nTAPE', sub:'Curated Art. Every Wall.', body:'당신의 벽 위에,\n단단하게 고정합니다.\n\nsilver-tape.com', cta:'Follow @silvertape.art',
    cap:'SILVERTAPE\nCurated Art. Every Wall.\n\n당신의 벽 위에, 단단하게 고정합니다.\n\n🔗 silver-tape.com\n\n#SILVERTAPE #CuratedArt #EveryWall #아트포스터 #아트플랫폼' },
];

function html(c) {
  const img = b64(c.img);
  const lines = c.h.split('\n');
  const blines = c.body.split('\n');
  const n = String(c.num).padStart(2,'0');
  const isFull = c.layout === 'full';

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;700;900&family=Space+Grotesk:wght@400;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1080px;background:#0a0a0a;color:#fff;font-family:'Noto Sans KR',sans-serif;overflow:hidden;position:relative}
${isFull ? `
.bg{position:absolute;inset:0;background:url('${img}') center/cover no-repeat}
.ov{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0.4) 0%,rgba(0,0,0,0.7) 60%,rgba(0,0,0,0.85) 100%)}
.ct{position:relative;z-index:2;width:100%}
` : `
.bg{position:absolute;right:0;top:0;width:55%;height:100%;background:url('${img}') center/cover no-repeat}
.bg::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,#0a0a0a 0%,rgba(10,10,10,0.6) 40%,rgba(10,10,10,0) 100%)}
.ov{display:none}
.ct{position:relative;z-index:2;width:55%}
`}
.in{padding:56px 60px;display:flex;flex-direction:column;height:100%}
.top{display:flex;justify-content:space-between;align-items:center;margin-bottom:36px}
.logo{font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:700;letter-spacing:4px;color:rgba(255,255,255,0.5)}
.cat{font-size:11px;font-weight:700;letter-spacing:3px;color:${c.accent};text-transform:uppercase}
.hl{font-size:62px;font-weight:900;line-height:1.06;letter-spacing:-2px;margin-bottom:14px;text-shadow:0 2px 30px rgba(0,0,0,0.6)}
.hl .a{color:${c.accent}}
.sub{font-size:16px;font-weight:300;color:rgba(255,255,255,0.5);margin-bottom:36px;letter-spacing:.5px}
.body{font-size:18px;font-weight:300;line-height:1.75;color:rgba(255,255,255,0.75);flex:1}
.bot{margin-top:auto;padding-top:24px;border-top:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;align-items:center}
.cta{font-family:'Space Grotesk',sans-serif;font-size:14px;font-weight:700;color:${c.accent};letter-spacing:1px}
.nm{font-size:11px;color:rgba(255,255,255,0.2)}
.line{position:absolute;${isFull?'bottom:0;left:0;right:0;height:3px':'top:0;bottom:0;left:54%;width:3px'};background:${c.accent};opacity:.15;z-index:3}
</style></head>
<body>
<div class="bg"></div><div class="ov"></div><div class="line"></div>
<div class="ct"><div class="in">
<div class="top"><span class="logo">SILVERTAPE</span><span class="cat">${c.cat}</span></div>
<div class="hl">${lines.map((l,i)=>i===0?`<span class="a">${l}</span>`:l).join('<br>')}</div>
<div class="sub">${c.sub}</div>
<div class="body">${blines.join('<br>')}</div>
<div class="bot"><span class="cta">${c.cta}</span><span class="nm">${n} / 30</span></div>
</div></div>
</body></html>`;
}

console.log('Generating HTML...');
for (const c of cards) {
  const n = String(c.num).padStart(2,'0');
  writeFileSync(join(HTML_DIR, `${n}.html`), html(c));
}

console.log('Rendering PNGs...');
const browser = await puppeteer.launch({headless:true,args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']});
const page = await browser.newPage();
await page.setViewport({width:1080,height:1080,deviceScaleFactor:1});

for (const c of cards) {
  const n = String(c.num).padStart(2,'0');
  const p = `file://${resolve(HTML_DIR,`${n}.html`)}`;
  await page.goto(p,{waitUntil:'networkidle0',timeout:15000}).catch(()=>page.goto(p,{waitUntil:'load'}));
  await new Promise(r=>setTimeout(r,400));
  await page.screenshot({path:join(PNG_DIR,`silvertape-${n}.png`),type:'png',clip:{x:0,y:0,width:1080,height:1080}});
  console.log(`  ✅ silvertape-${n}.png`);
}
await browser.close();

// captions
const md = cards.map(c=>{
  const n=String(c.num).padStart(2,'0');
  return `## ${n}. ${c.h.split('\n')[0]} — ${c.cat}\n\n${c.cap}\n\n---`;
}).join('\n\n');
writeFileSync(join(BASE,'captions-v2.md'),`# SILVERTAPE Instagram 홍보 캡션 v2\n\n> silver-tape.com 기반 — 복사해서 바로 사용\n\n---\n\n${md}\n`);

console.log(`\n🎉 완료! ${cards.length}개 PNG → output/silvertape-ads/png-v2/`);
console.log('📝 캡션 → output/silvertape-ads/captions-v2.md');
