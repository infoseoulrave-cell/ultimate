import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const OUT = join(import.meta.dirname || '.', 'cards');
mkdirSync(OUT, { recursive: true });

const cards = [
  {
    num: 1, title: '색채 심리학', subtitle: 'Color Psychology',
    emoji: '🎨', bg: 'linear-gradient(135deg, #FF6B6B, #FFA07A)',
    points: ['빨강: 열정, 에너지, 긴급함', '파랑: 신뢰, 안정, 전문성', '노랑: 낙관, 행복, 주의', '초록: 자연, 성장, 균형', '보라: 창의, 고급, 신비'],
    tip: '브랜드 정체성에 맞는 색상을 선택하세요'
  },
  {
    num: 2, title: '미니멀리즘 디자인', subtitle: 'Less is More',
    emoji: '⬜', bg: 'linear-gradient(135deg, #2C3E50, #4CA1AF)',
    points: ['불필요한 요소를 제거하라', '여백은 디자인의 일부다', '한두 가지 색상만 사용', '타이포그래피로 계층 구조 표현', '기능이 형태를 결정한다'],
    tip: '"Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away." — Antoine de Saint-Exupéry'
  },
  {
    num: 3, title: '타이포그래피 기초', subtitle: 'Typography 101',
    emoji: '🔤', bg: 'linear-gradient(135deg, #667eea, #764ba2)',
    points: ['서체 vs 글꼴의 차이 이해', '본문: 가독성 > 장식성', '제목: 2~3개 서체까지만', '자간·행간·단락 간격 조절', 'Sans-serif: 모던 / Serif: 클래식'],
    tip: '좋은 타이포그래피는 읽히는 것이지 보이는 것이 아니다'
  },
  {
    num: 4, title: '황금비율', subtitle: 'Golden Ratio 1:1.618',
    emoji: '🐚', bg: 'linear-gradient(135deg, #F2994A, #F2C94C)',
    points: ['자연에서 발견되는 비율 1:1.618', '로고 디자인에 활용 (Apple, Twitter)', '레이아웃 분할에 적용', '피보나치 수열과의 관계', '사진 구도에서 삼분법과 연결'],
    tip: '강제하지 마세요 — 자연스러운 가이드라인으로 활용'
  },
  {
    num: 5, title: 'UI/UX 트렌드 2026', subtitle: 'Design Trends',
    emoji: '📱', bg: 'linear-gradient(135deg, #00B4DB, #0083B0)',
    points: ['AI 생성 개인화 인터페이스', '글래스모피즘 → 뉴트로피즘', '마이크로 인터랙션 필수', '다크모드 기본 지원', '음성·제스처 하이브리드 UI'],
    tip: '트렌드를 따르되, 사용성을 희생하지 마세요'
  },
  {
    num: 6, title: '로고 디자인 원칙', subtitle: 'Logo Design',
    emoji: '✏️', bg: 'linear-gradient(135deg, #E44D26, #F16529)',
    points: ['단순할수록 기억에 남는다', '흑백에서도 작동해야 한다', '축소해도 읽혀야 한다', '시대를 초월하는 디자인 지향', '브랜드 스토리를 담아라'],
    tip: 'Nike 스우시는 35달러에 탄생했다 — 아이디어가 핵심'
  },
  {
    num: 7, title: '컬러 팔레트 만들기', subtitle: 'Color Palette',
    emoji: '🌈', bg: 'linear-gradient(135deg, #a8ff78, #78ffd6)',
    points: ['60-30-10 법칙: 주색60% 보조30% 강조10%', '보색 대비로 시선 유도', '유사색으로 조화로운 분위기', '자연에서 팔레트 추출하기', 'Coolors, Adobe Color 활용'],
    tip: '색상은 3~5개로 제한하세요', dark: true
  },
  {
    num: 8, title: '그리드 시스템', subtitle: 'Grid System',
    emoji: '📐', bg: 'linear-gradient(135deg, #434343, #000000)',
    points: ['일관된 레이아웃의 기반', '12컬럼 그리드가 표준', 'margin · gutter · column 이해', '반응형 브레이크포인트 설정', '규칙을 알아야 깨뜨릴 수 있다'],
    tip: '그리드는 감옥이 아니라 뼈대다'
  },
  {
    num: 9, title: '여백의 미학', subtitle: 'White Space',
    emoji: '🕊️', bg: 'linear-gradient(135deg, #FAFAFA, #E0E0E0)',
    points: ['여백 = 고급스러움의 신호', '가독성을 극적으로 향상', '시각적 계층 구조 강화', 'Apple, Muji의 성공 비결', '채우려는 충동을 참아라'],
    tip: '"여백은 낭비가 아니라 투자다"', dark: true
  },
  {
    num: 10, title: '브랜딩 101', subtitle: 'Brand Identity',
    emoji: '🏷️', bg: 'linear-gradient(135deg, #8E2DE2, #4A00E0)',
    points: ['로고 + 컬러 + 타이포 = 비주얼 아이덴티티', '톤 앤 매너 가이드 수립', '일관성이 신뢰를 만든다', '타깃 오디언스 명확히 정의', '브랜드 스토리텔링의 힘'],
    tip: '브랜드는 만드는 것이 아니라 인식되는 것이다'
  },
  {
    num: 11, title: '사진 구도 법칙', subtitle: 'Composition Rules',
    emoji: '📷', bg: 'linear-gradient(135deg, #11998e, #38ef7d)',
    points: ['삼분법: 교차점에 피사체 배치', '리딩 라인으로 시선 유도', '프레임 안의 프레임 활용', '대칭 vs 비대칭의 긴장감', '네거티브 스페이스 활용'],
    tip: '규칙을 배운 후 의도적으로 깨뜨리세요'
  },
  {
    num: 12, title: '디지털 아트 도구', subtitle: 'Digital Art Tools',
    emoji: '🖌️', bg: 'linear-gradient(135deg, #FC5C7D, #6A82FB)',
    points: ['Procreate: iPad 최강 드로잉', 'Photoshop: 올라운드 편집', 'Illustrator: 벡터 그래픽', 'Figma: UI/UX 협업', 'Blender: 무료 3D 모델링'],
    tip: '도구보다 기본기가 중요합니다'
  },
  {
    num: 13, title: '모션 그래픽 기초', subtitle: 'Motion Graphics',
    emoji: '🎬', bg: 'linear-gradient(135deg, #ff9966, #ff5e62)',
    points: ['12가지 애니메이션 원칙 (Disney)', 'Ease-in / Ease-out 필수', '0.2~0.5초가 최적 전환 시간', 'After Effects vs Lottie', 'UI 마이크로 애니메이션의 가치'],
    tip: '움직임에도 목적이 있어야 한다'
  },
  {
    num: 14, title: '인포그래픽 디자인', subtitle: 'Infographic',
    emoji: '📊', bg: 'linear-gradient(135deg, #2193b0, #6dd5ed)',
    points: ['데이터를 시각적 스토리로 변환', '아이콘으로 복잡한 개념 단순화', '수치에 맥락을 부여하라', '시선 흐름: 위→아래, 좌→우', '하나의 핵심 메시지에 집중'],
    tip: '좋은 인포그래픽은 5초 안에 핵심이 전달된다'
  },
  {
    num: 15, title: '빈티지 디자인', subtitle: 'Vintage Aesthetic',
    emoji: '📜', bg: 'linear-gradient(135deg, #8B7355, #D2B48C)',
    points: ['세리프 서체 + 장식 요소', '뮤트된 따뜻한 컬러 팔레트', '텍스처와 그레인 효과 활용', '레터프레스·활판 인쇄 스타일', '핸드드로잉 일러스트 감성'],
    tip: '빈티지 ≠ 오래된 것. 의도된 클래식이다'
  },
  {
    num: 16, title: '3D 디자인 입문', subtitle: '3D Design Basics',
    emoji: '🧊', bg: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
    points: ['Blender: 무료, 강력, 커뮤니티 활발', 'Three.js: 웹 기반 3D', 'Spline: 쉬운 3D 웹 디자인', '조명이 3D의 80%를 결정', '재질(Material)로 현실감 표현'],
    tip: '3D는 웹/앱 디자인의 차별화 무기'
  },
  {
    num: 17, title: '접근성과 디자인', subtitle: 'Accessibility',
    emoji: '♿', bg: 'linear-gradient(135deg, #1A2980, #26D0CE)',
    points: ['색상 대비 비율 4.5:1 이상', '색맹을 고려한 UI 디자인', 'Alt 텍스트는 의무', '키보드 네비게이션 지원', 'WCAG 2.1 AA 기준 준수'],
    tip: '접근성은 선택이 아니라 기본이다'
  },
  {
    num: 18, title: '패턴 디자인', subtitle: 'Pattern Design',
    emoji: '🔲', bg: 'linear-gradient(135deg, #56ab2f, #a8e063)',
    points: ['반복의 미학: 타일링 원리', '기하학 패턴 vs 유기적 패턴', '심리스(seamless) 패턴 만들기', '패턴의 스케일과 밀도 조절', '브랜딩에 패턴 활용하기'],
    tip: '패턴은 배경이 아니라 정체성이다', dark: true
  },
  {
    num: 19, title: '아이콘 디자인', subtitle: 'Icon Design Guide',
    emoji: '🔣', bg: 'linear-gradient(135deg, #654ea3, #eaafc8)',
    points: ['24px 그리드에서 시작', '선 굵기·모서리 반경 통일', '시각적 무게 균형 맞추기', 'Outlined vs Filled 스타일 통일', '1초 안에 의미 전달'],
    tip: '아이콘은 작은 크기의 대화다'
  },
  {
    num: 20, title: '디자인 시스템', subtitle: 'Design System',
    emoji: '🧩', bg: 'linear-gradient(135deg, #1CB5E0, #000046)',
    points: ['Atom → Molecule → Organism → Template', '토큰: 색상·간격·그림자·타이포 정의', '컴포넌트 라이브러리 구축', 'Figma + Storybook 연동', '문서화가 시스템의 생명'],
    tip: 'Material Design, Ant Design을 참고하세요'
  },
  {
    num: 21, title: '바우하우스의 유산', subtitle: 'Bauhaus Legacy',
    emoji: '🏛️', bg: 'linear-gradient(135deg, #C33764, #1D2671)',
    points: ['1919년 독일에서 시작된 혁명', '형태는 기능을 따른다', '기하학적 형태 + 원색 활용', '예술과 기술의 통합', '현대 디자인의 뿌리'],
    tip: '100년 전의 원칙이 오늘의 디자인을 지배한다'
  },
  {
    num: 22, title: '일본 디자인 미학', subtitle: 'Japanese Aesthetics',
    emoji: '🎌', bg: 'linear-gradient(135deg, #C9D6FF, #E2E2E2)',
    points: ['와비사비(侘寂): 불완전함의 아름다움', '마(間): 여백과 공간의 미학', '겐소(減素): 본질만 남기기', '무지(MUJI): 심플의 극치', '자연 소재와 질감 존중'],
    tip: '완벽하지 않아도 아름다울 수 있다', dark: true
  },
  {
    num: 23, title: '포스터 디자인', subtitle: 'Poster Design Tips',
    emoji: '🖼️', bg: 'linear-gradient(135deg, #f12711, #f5af19)',
    points: ['한 가지 핵심 메시지에 집중', '시각적 계층: 제목→이미지→본문→CTA', '대담한 타이포그래피 사용', '컬러 대비로 시선 포착', '3미터 거리에서도 읽혀야 한다'],
    tip: '포스터는 3초 안에 승부가 난다'
  },
  {
    num: 24, title: 'SNS 디자인 가이드', subtitle: 'Social Media Design',
    emoji: '📲', bg: 'linear-gradient(135deg, #E040FB, #FF6D00)',
    points: ['인스타: 1080×1080 / 1080×1350', '스토리: 1080×1920 (9:16)', '일관된 피드 컬러 톤 유지', '텍스트 오버레이: 간결하게', '첫 이미지가 클릭을 결정'],
    tip: '스크롤을 멈추게 하는 디자인을 만드세요'
  },
  {
    num: 25, title: '디자인 도구 비교', subtitle: 'Tool Comparison',
    emoji: '⚔️', bg: 'linear-gradient(135deg, #373B44, #4286f4)',
    points: ['Figma: 협업 최강, 웹 기반, 무료', 'Sketch: macOS 전용, 플러그인 풍부', 'Adobe XD: CC 통합, 프로토타이핑', 'Canva: 비디자이너용, 템플릿 풍부', 'Framer: 코드 기반 프로토타입'],
    tip: '최고의 도구는 당신이 가장 잘 쓰는 도구다'
  },
  {
    num: 26, title: 'AI와 디자인의 미래', subtitle: 'AI × Design',
    emoji: '🤖', bg: 'linear-gradient(135deg, #0F2027, #203A43, #2C5364)',
    points: ['Midjourney, DALL-E: 이미지 생성', 'AI 기반 레이아웃 자동화', '개인화된 UX 실시간 생성', '디자이너의 역할: 큐레이터로 진화', 'AI는 도구이고 창의력은 인간의 것'],
    tip: 'AI를 두려워하지 말고 활용하세요'
  },
  {
    num: 27, title: '반응형 디자인', subtitle: 'Responsive Design',
    emoji: '💻', bg: 'linear-gradient(135deg, #4568DC, #B06AB3)',
    points: ['모바일 퍼스트 접근법', '유동적 그리드 + 유동적 이미지', '미디어 쿼리 브레이크포인트 설정', '터치 타깃 최소 44×44px', '콘텐츠 우선순위 재배치'],
    tip: '기기가 아니라 콘텐츠에 맞춰 디자인하세요'
  },
  {
    num: 28, title: '감성 디자인', subtitle: 'Emotional Design',
    emoji: '💜', bg: 'linear-gradient(135deg, #ee9ca7, #ffdde1)',
    points: ['본능적 → 행동적 → 반성적 3단계', '마이크로카피로 감정 연결', '색상·형태·애니메이션의 감정 효과', '사용자의 기쁨을 디자인하라', 'Don Norman의 감성 디자인 이론'],
    tip: '좋은 디자인은 미소 짓게 만든다', dark: true
  },
  {
    num: 29, title: '포트폴리오 팁', subtitle: 'Design Portfolio',
    emoji: '💼', bg: 'linear-gradient(135deg, #333333, #dd1818)',
    points: ['베스트 작업 5~10개만 엄선', '프로세스를 보여주세요 (before→after)', '문제 → 해결 → 결과 스토리', '모바일에서도 잘 보이게', 'Behance, Dribbble, 개인 사이트'],
    tip: '포트폴리오는 양보다 질이다'
  },
  {
    num: 30, title: '창의력 향상법', subtitle: 'Boost Creativity',
    emoji: '💡', bg: 'linear-gradient(135deg, #F7971E, #FFD200)',
    points: ['매일 드로잉·스케치 습관', '다른 분야에서 영감 찾기 (음악, 건축, 자연)', '제약 조건이 창의력을 키운다', '피드백을 두려워하지 마세요', '산책·명상으로 무의식 활성화'],
    tip: '"창의력은 근육이다. 쓸수록 강해진다"', dark: true
  },
];

function generateCard(card) {
  const textColor = card.dark ? '#1a1a1a' : '#ffffff';
  const subColor = card.dark ? '#444' : 'rgba(255,255,255,0.85)';
  const pointBg = card.dark ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.15)';
  const tipBg = card.dark ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)';
  const numStr = String(card.num).padStart(2, '0');

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1080px; height: 1080px; font-family: 'Noto Sans KR', sans-serif; background: ${card.bg}; color: ${textColor}; display: flex; flex-direction: column; padding: 60px; overflow: hidden; }
  .header { display: flex; align-items: center; gap: 16px; margin-bottom: 8px; }
  .num { font-size: 18px; font-weight: 700; opacity: 0.6; letter-spacing: 2px; }
  .emoji { font-size: 64px; margin-bottom: 12px; }
  .title { font-size: 52px; font-weight: 900; line-height: 1.2; margin-bottom: 6px; }
  .subtitle { font-size: 22px; font-weight: 400; opacity: 0.7; margin-bottom: 36px; letter-spacing: 1px; }
  .points { flex: 1; display: flex; flex-direction: column; gap: 14px; }
  .point { background: ${pointBg}; backdrop-filter: blur(10px); border-radius: 16px; padding: 18px 24px; font-size: 22px; line-height: 1.5; font-weight: 400; display: flex; align-items: center; gap: 14px; }
  .point-num { width: 32px; height: 32px; border-radius: 50%; background: ${card.dark ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.25)'}; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 700; flex-shrink: 0; }
  .tip { margin-top: 28px; padding: 20px 24px; background: ${tipBg}; border-radius: 16px; border-left: 4px solid ${card.dark ? '#333' : 'rgba(255,255,255,0.5)'}; }
  .tip-label { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; opacity: 0.6; margin-bottom: 6px; }
  .tip-text { font-size: 18px; line-height: 1.5; font-style: italic; }
  .footer { margin-top: 24px; display: flex; justify-content: space-between; align-items: center; opacity: 0.5; font-size: 14px; }
</style></head>
<body>
  <div class="header"><span class="num">${numStr} / 30</span></div>
  <div class="emoji">${card.emoji}</div>
  <div class="title">${card.title}</div>
  <div class="subtitle">${card.subtitle}</div>
  <div class="points">
    ${card.points.map((p, i) => `<div class="point"><span class="point-num">${i + 1}</span>${p}</div>`).join('\n    ')}
  </div>
  <div class="tip">
    <div class="tip-label">💡 TIP</div>
    <div class="tip-text">${card.tip}</div>
  </div>
  <div class="footer">
    <span>@ultimate.design</span>
    <span>Art & Design Series</span>
  </div>
</body></html>`;
}

for (const card of cards) {
  const numStr = String(card.num).padStart(2, '0');
  const filename = `card-${numStr}-${card.title.replace(/[\/\\:*?"<>|]/g, '').replace(/\s+/g, '-')}.html`;
  writeFileSync(join(OUT, filename), generateCard(card));
}

const indexHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Art & Design Card News — 30 Cards</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Noto Sans KR', sans-serif; background: #111; color: #fff; padding: 40px; }
  h1 { text-align: center; font-size: 36px; margin-bottom: 12px; }
  .sub { text-align: center; color: #888; margin-bottom: 40px; font-size: 16px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; max-width: 1400px; margin: 0 auto; }
  .card-link { display: block; text-decoration: none; border-radius: 16px; overflow: hidden; transition: transform 0.2s; aspect-ratio: 1; }
  .card-link:hover { transform: scale(1.03); }
  .card-preview { width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 24px; text-align: center; }
  .card-preview .emoji { font-size: 48px; margin-bottom: 12px; }
  .card-preview .title { font-size: 22px; font-weight: 700; color: #fff; }
  .card-preview .num { font-size: 13px; opacity: 0.6; margin-top: 8px; color: #fff; }
  .howto { max-width: 800px; margin: 60px auto 0; padding: 30px; background: #222; border-radius: 16px; }
  .howto h2 { margin-bottom: 16px; }
  .howto p { color: #aaa; line-height: 1.8; }
  code { background: #333; padding: 2px 8px; border-radius: 4px; font-size: 14px; }
</style></head>
<body>
<h1>🎨 Art & Design Card News</h1>
<p class="sub">인스타그램 피드용 카드뉴스 30장 — 각 카드를 클릭하면 1080×1080 원본을 볼 수 있습니다</p>
<div class="grid">
${cards.map(c => {
  const numStr = String(c.num).padStart(2, '0');
  const filename = `card-${numStr}-${c.title.replace(/[\/\\:*?"<>|]/g, '').replace(/\s+/g, '-')}.html`;
  return `  <a class="card-link" href="cards/${filename}" target="_blank" style="background:${c.bg}">
    <div class="card-preview">
      <div class="emoji">${c.emoji}</div>
      <div class="title">${c.title}</div>
      <div class="num">${numStr}/30 · ${c.subtitle}</div>
    </div>
  </a>`;
}).join('\n')}
</div>
<div class="howto">
  <h2>📸 인스타그램에 올리는 방법</h2>
  <p>1. 각 카드 HTML을 브라우저에서 열기<br>
  2. 브라우저 창 크기를 1080×1080에 맞추기 (또는 개발자 도구에서 디바이스 크기 설정)<br>
  3. 스크린샷 또는 <code>Cmd+Shift+4</code> (Mac) / <code>Win+Shift+S</code> (Windows)로 캡처<br>
  4. 인스타그램 피드에 업로드<br><br>
  💡 자동화: <code>npm install puppeteer</code> 후 스크립트로 일괄 PNG 변환 가능</p>
</div>
</body></html>`;

writeFileSync(join(import.meta.dirname || '.', 'index.html'), indexHtml);
console.log(`✅ 30 cards generated in ${OUT}`);
console.log(`📄 Index page: output/card-news/index.html`);
