import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const OUT = join(import.meta.dirname || '.', 'cards');
mkdirSync(OUT, { recursive: true });

const cards = [
  // === 브랜드 스토리 (1-5) ===
  { num: 1, category: 'BRAND', bg: '#0a0a0a', accent: '#C0C0C0',
    headline: '모든 벽에\n예술을.',
    sub: 'Every wall deserves a sensation.',
    body: '미술관에서만 예술을 만날 필요는 없다.\n당신이 매일 마주하는 벽이\n캔버스가 되는 순간.',
    cta: 'silvertape.art', tag: '#SILVERTAPE #아트포스터 #큐레이션',
    caption: '예술은 미술관 밖에도 있다.\n\n매일 지나치는 벽, 매일 마주하는 공간.\n거기에 한 장의 포스터가 놓이면\n일상이 달라진다.\n\nSILVERTAPE — 모든 벽에 예술을.\n\n🔗 silvertape.art\n\n#SILVERTAPE #아트포스터 #인테리어아트 #큐레이션 #벽장식 #아트프린트 #포스터추천 #공간디자인'
  },
  { num: 2, category: 'BRAND', bg: '#0a0a0a', accent: '#C0C0C0',
    headline: 'Tape Art\nto Your Wall.',
    sub: '실버 테이프처럼 단단하게.',
    body: '각기 다른 시선을 가진 스튜디오들이\n큐레이션한 작품을, 프리미엄 프린트라는\n물성 위에 올려 당신의 벽에 고정한다.',
    cta: '지금 컬렉션 보기 →', tag: '#TapeArt #SILVERTAPE',
    caption: 'Tape Art to Your Wall.\n\n우리는 예술을 벽 위에 고정합니다.\n실버 테이프처럼 단단하게.\n\n각기 다른 시선을 가진 스튜디오들의 작품을\n프리미엄 프린트라는 물성 위에 올립니다.\n\n🔗 silvertape.art\n\n#SILVERTAPE #아트큐레이션 #프리미엄프린트 #아트포스터 #인테리어 #감성인테리어'
  },
  { num: 3, category: 'BRAND', bg: '#111', accent: '#E8D5B7',
    headline: '한정판은\n한 번 품절되면\n끝입니다.',
    sub: 'Limited Edition — Once gone, gone forever.',
    body: '각 작품은 제한된 수량으로만 프린트됩니다.\n소장 가치가 있는 예술,\n지금이 아니면 없습니다.',
    cta: '한정판 보러가기 →', tag: '#한정판 #LimitedEdition',
    caption: '⚠️ 한정판은 한 번 품절되면 끝입니다.\n\n각 작품은 제한된 수량으로만 프린트됩니다.\n대량 생산이 아닌, 소장 가치가 있는 예술.\n\n지금이 아니면 없습니다.\n\n🔗 silvertape.art\n\n#한정판 #LimitedEdition #아트포스터 #소장가치 #SILVERTAPE #아트컬렉션'
  },
  { num: 4, category: 'BRAND', bg: '#0d0d0d', accent: '#FF6B6B',
    headline: '5만원 이상\n무료배송',
    sub: 'Free shipping over ₩50,000',
    body: '전국 어디든, 안전한 튜브 포장으로\n작품을 그대로 전달합니다.\n프리미엄 포장 · 빠른 배송.',
    cta: 'silvertape.art', tag: '#무료배송 #안전포장',
    caption: '📦 5만원 이상 무료배송\n\n전국 어디든, 작품이 훼손되지 않도록\n프리미엄 튜브 포장으로 안전하게 전달합니다.\n\n🔗 silvertape.art\n\n#무료배송 #SILVERTAPE #아트포스터 #프리미엄포장 #안전배송'
  },
  { num: 5, category: 'BRAND', bg: '#0a0a0a', accent: '#4ECDC4',
    headline: '감각은\n설명할 수 없지만\n분명히 존재한다.',
    sub: 'Art is the only force that can stop your step.',
    body: '걸음을 멈추게 하는 한 장의 그림,\n무심히 벽에 걸어두었는데\n어느 날 문득 눈이 가는 포스터.\n\n그 감각을 전하기 위해.',
    cta: 'SILVERTAPE', tag: '#감각 #아트',
    caption: '감각은 설명할 수 없지만\n분명히 존재한다.\n\n걸음을 멈추게 하는 한 장의 그림.\n무심히 걸어두었는데 어느 날 문득 눈이 가는 포스터.\n\nSILVERTAPE는 그 감각을 전하기 위해 만들어졌습니다.\n\n🔗 silvertape.art\n\n#SILVERTAPE #감성아트 #아트포스터 #인테리어포스터 #감각적인공간'
  },
  // === 스튜디오 소개 (6-11) ===
  { num: 6, category: 'STUDIO', bg: '#0f0f1a', accent: '#FF00FF',
    headline: 'HANGOVER\nSTUDIO',
    sub: 'Cyberpunk × Nature — 사이버펑크가 자연과 만나는 곳',
    body: '네온 불빛 아래 피어나는 자연.\n도시의 그리드 속 유기적 생명력.\n디지털과 아날로그의 경계를 녹인다.',
    cta: 'Neon Flamingo · Impasto Emotion →', tag: '#HANGOVER #사이버펑크',
    caption: '🔥 HANGOVER STUDIO\nCyberpunk × Nature\n\n사이버펑크가 자연과 만나는 곳.\n네온 불빛 아래 피어나는 자연,\n도시의 그리드 속 유기적 생명력.\n\n대표작: Neon Flamingo, Impasto Emotion\n\n🔗 silvertape.art/studio/hangover\n\n#HANGOVER #사이버펑크아트 #네온아트 #SILVERTAPE #아트포스터 #디지털아트'
  },
  { num: 7, category: 'STUDIO', bg: '#0a0a0a', accent: '#FFFFFF',
    headline: 'VOID.\nSTUDIO',
    sub: 'The beauty of absence — 부재의 아름다움',
    body: '아무것도 없는 곳에서 시작되는 예술.\n여백이 말하는 것,\n침묵이 들려주는 것.',
    cta: 'VOID. 컬렉션 보기 →', tag: '#VOID #미니멀아트',
    caption: '◻️ VOID. STUDIO\nThe beauty of absence\n\n아무것도 없는 곳에서 시작되는 예술.\n여백이 말하는 것, 침묵이 들려주는 것.\n\n미니멀의 극치를 경험하세요.\n\n🔗 silvertape.art/studio/void\n\n#VOID #미니멀아트 #여백 #SILVERTAPE #아트포스터 #모던아트'
  },
  { num: 8, category: 'STUDIO', bg: '#1a0a0a', accent: '#FF4444',
    headline: 'SENSIBILITY\nSTAIR',
    sub: '감각의 계단 — 한 층씩 올라가는 감성',
    body: '색채와 질감으로 쌓아 올린 감각의 층위.\nHelvetica Strike · Red Carpet Repose ·\nData Aisle · Mint Essence',
    cta: '전체 작품 보기 →', tag: '#SENSIBILITY #감성아트',
    caption: '🎨 SENSIBILITY STAIR\n감각의 계단\n\n색채와 질감으로 쌓아 올린 감각의 층위.\n한 층씩 올라갈 때마다 새로운 감성을 만납니다.\n\n대표작: Helvetica Strike, Red Carpet Repose, Data Aisle\n\n🔗 silvertape.art/studio/sensibility\n\n#SENSIBILITY #감성아트 #SILVERTAPE #아트포스터 #컬러풀아트'
  },
  { num: 9, category: 'STUDIO', bg: '#0d0d0d', accent: '#FFD700',
    headline: 'Top Shelf',
    sub: "This Week's High — 이번 주 클릭률 TOP",
    body: '매주 업데이트되는 기대작.\n가장 많은 시선이 머문 작품들.\n당신의 선택을 기다리고 있습니다.',
    cta: 'TOP SHELF 보기 →', tag: '#TopShelf #이번주기대작',
    caption: '🏆 TOP SHELF — 이번 주의 기대작\n\n매주 업데이트되는 클릭률 TOP 작품들.\n가장 많은 시선이 머문 곳,\n당신의 선택을 기다리고 있습니다.\n\n🔗 silvertape.art\n\n#TopShelf #SILVERTAPE #아트포스터 #이번주추천 #베스트셀러'
  },
  { num: 10, category: 'PRODUCT', bg: '#111', accent: '#FF9500',
    headline: 'Impasto\nEmotion',
    sub: 'HANGOVER — fine art poster',
    body: '물감이 튀어나올 것 같은 질감.\n디지털이 만든 임파스토의 감정.\n₩112,000 · 프리미엄 프린트',
    cta: '작품 상세보기 →', tag: '#ImpastoEmotion #HANGOVER',
    caption: '🖼 Impasto Emotion\nby HANGOVER STUDIO\n\n물감이 튀어나올 것 같은 질감.\n디지털이 만든 임파스토의 감정.\n\n프리미엄 파인 아트 프린트\n₩112,000\n\n🔗 silvertape.art/studio/hangover/impasto-emotion\n\n#ImpastoEmotion #HANGOVER #SILVERTAPE #아트포스터 #파인아트 #인테리어포스터'
  },
  { num: 11, category: 'PRODUCT', bg: '#0a0a14', accent: '#00FFAA',
    headline: 'Neon\nFlamingo',
    sub: 'HANGOVER — Cyberpunk × Nature',
    body: '사이버펑크가 자연과 만나는 곳.\n빗물 웅덩이에 핑크 빛이 반사된다.\n₩112,000 · 한정판',
    cta: '소장하기 →', tag: '#NeonFlamingo #사이버펑크',
    caption: '🦩 Neon Flamingo\nby HANGOVER STUDIO\n\n사이버펑크가 자연과 만나는 곳.\n빗물 웅덩이에 핑크 빛이 반사된다.\n\n한정판 프리미엄 프린트\n₩112,000\n\n🔗 silvertape.art/studio/hangover\n\n#NeonFlamingo #HANGOVER #SILVERTAPE #사이버펑크 #네온아트 #한정판'
  },
  // === 라이프스타일 / 인테리어 (12-17) ===
  { num: 12, category: 'LIFESTYLE', bg: '#0d0d0d', accent: '#B8860B',
    headline: '거실이\n갤러리가\n되는 순간.',
    sub: 'Your living room, reimagined.',
    body: '소파 위 빈 벽.\n거기에 한 장의 포스터가 놓이면\n공간의 온도가 달라진다.',
    cta: 'silvertape.art', tag: '#거실인테리어 #갤러리',
    caption: '🏠 거실이 갤러리가 되는 순간.\n\n소파 위 빈 벽.\n거기에 한 장의 포스터가 놓이면\n공간의 온도가 달라진다.\n\n당신의 벽은 어떤 이야기를 하고 있나요?\n\n🔗 silvertape.art\n\n#거실인테리어 #아트포스터 #갤러리벽 #SILVERTAPE #공간꾸미기 #인테리어소품'
  },
  { num: 13, category: 'LIFESTYLE', bg: '#111', accent: '#E6E6FA',
    headline: '작업실에\n영감을\n걸어두세요.',
    sub: 'Surround yourself with inspiration.',
    body: '매일 마주하는 시선 안에\n영감의 원천을 배치하세요.\n크리에이터를 위한 공간 큐레이션.',
    cta: '크리에이터 추천 →', tag: '#작업실 #영감',
    caption: '💻 작업실에 영감을 걸어두세요.\n\n매일 마주하는 시선 안에\n영감의 원천을 배치하면\n작업의 질이 달라집니다.\n\n크리에이터를 위한 공간 큐레이션.\n\n🔗 silvertape.art\n\n#작업실인테리어 #영감 #크리에이터 #SILVERTAPE #아트포스터 #작업공간'
  },
  { num: 14, category: 'LIFESTYLE', bg: '#0a0a0a', accent: '#FF6B9D',
    headline: '선물하기\n가장 좋은\n예술.',
    sub: 'The perfect gift — art that stays.',
    body: '꽃은 시들고, 케이크는 사라지지만\n벽 위의 예술은 매일 남습니다.\n생일 · 집들이 · 기념일 선물.',
    cta: '선물 추천 보기 →', tag: '#선물 #기념일',
    caption: '🎁 선물하기 가장 좋은 예술.\n\n꽃은 시들고, 케이크는 사라지지만\n벽 위의 예술은 매일 남습니다.\n\n생일 · 집들이 · 기념일\n의미 있는 선물을 찾고 있다면.\n\n🔗 silvertape.art\n\n#선물추천 #집들이선물 #생일선물 #아트포스터 #SILVERTAPE #의미있는선물'
  },
  { num: 15, category: 'LIFESTYLE', bg: '#0f0f0f', accent: '#87CEEB',
    headline: '카페 사장님,\n벽이 비어\n있습니다.',
    sub: 'For cafés, studios, and offices.',
    body: '상업 공간의 분위기는\n벽 위의 한 장이 결정합니다.\nB2B 대량 주문 · 공간 컨설팅 가능.',
    cta: '문의하기 →', tag: '#카페인테리어 #상업공간',
    caption: '☕ 카페 사장님, 벽이 비어 있습니다.\n\n상업 공간의 분위기는\n벽 위의 한 장이 결정합니다.\n\n카페 · 스튜디오 · 오피스\nB2B 대량 주문 · 공간 컨설팅 가능.\n\n🔗 silvertape.art\n\n#카페인테리어 #상업공간 #오피스인테리어 #SILVERTAPE #아트포스터 #공간디자인'
  },
  { num: 16, category: 'LIFESTYLE', bg: '#111', accent: '#DDA0DD',
    headline: '원룸도\n갤러리가\n될 수 있다.',
    sub: 'Small space, big impact.',
    body: '작은 공간일수록\n벽 위의 예술이 빛난다.\nA3 사이즈부터 시작하세요.',
    cta: '소형 프린트 보기 →', tag: '#원룸인테리어 #소형아트',
    caption: '🏙 원룸도 갤러리가 될 수 있다.\n\n작은 공간일수록\n벽 위의 예술이 빛납니다.\nA3 사이즈부터 시작하세요.\n\n🔗 silvertape.art\n\n#원룸인테리어 #자취방꾸미기 #아트포스터 #SILVERTAPE #작은공간 #인테리어소품'
  },
  { num: 17, category: 'LIFESTYLE', bg: '#0d0d0d', accent: '#98FB98',
    headline: '프레임 없이\n테이프로\n붙여보세요.',
    sub: 'No frame needed. Just tape it.',
    body: '마스킹 테이프, 워싱 테이프,\n혹은 실버 테이프.\n규칙 없이, 자유롭게.',
    cta: '#테이프인테리어', tag: '#테이프 #자유로운인테리어',
    caption: '📌 프레임 없이 테이프로 붙여보세요.\n\n마스킹 테이프, 워싱 테이프,\n혹은 실버 테이프.\n\n규칙 없이, 자유롭게.\n당신만의 방식으로 예술을 걸어보세요.\n\n🔗 silvertape.art\n\n#테이프인테리어 #아트포스터 #SILVERTAPE #프레임없이 #자유로운인테리어 #벽꾸미기'
  },
  // === 광고/프로모션 (18-23) ===
  { num: 18, category: 'PROMO', bg: '#0a0a0a', accent: '#FF4500',
    headline: 'NEW\nDROP',
    sub: 'VOID. 스튜디오 신작 공개',
    body: '새로운 시선, 새로운 여백.\nVOID. 스튜디오의 최신 컬렉션이\n지금 공개됩니다.',
    cta: '지금 보러가기 →', tag: '#NewDrop #VOID',
    caption: '🔔 NEW DROP\nVOID. 스튜디오 신작 공개\n\n새로운 시선, 새로운 여백.\nVOID. 스튜디오의 최신 컬렉션이\n지금 공개됩니다.\n\n⚡ 한정 수량 — 품절 전에 확인하세요.\n\n🔗 silvertape.art/studio/void\n\n#NewDrop #VOID #SILVERTAPE #신작공개 #아트포스터 #한정판'
  },
  { num: 19, category: 'PROMO', bg: '#111', accent: '#FFD700',
    headline: 'EXCLUSIVE\n단독 작품',
    sub: 'SILVERTAPE에서만 만날 수 있는 작품',
    body: '다른 곳에서는 구할 수 없습니다.\nSILVERTAPE 단독 큐레이션.\nExclusive 마크를 확인하세요.',
    cta: 'Exclusive 컬렉션 →', tag: '#Exclusive #단독',
    caption: '⭐ EXCLUSIVE — 단독 작품\n\nSILVERTAPE에서만 만날 수 있는 작품들.\n다른 곳에서는 구할 수 없습니다.\n\nExclusive 마크를 확인하세요.\n\n🔗 silvertape.art\n\n#Exclusive #단독작품 #SILVERTAPE #아트포스터 #한정판 #소장가치'
  },
  { num: 20, category: 'PROMO', bg: '#0d0d0d', accent: '#00CED1',
    headline: '첫 구매\n할인',
    sub: 'Welcome to SILVERTAPE — 첫 만남 기념',
    body: '처음 오신 분들을 위한 특별 혜택.\n뉴스레터 구독 시\n첫 주문 10% 할인.',
    cta: '지금 구독하기 →', tag: '#첫구매 #할인',
    caption: '🎉 첫 구매 할인\n\n처음 오신 분들을 위한 특별 혜택.\n뉴스레터 구독 시 첫 주문 10% 할인.\n\n예술과 함께하는 첫 걸음을\nSILVERTAPE에서 시작하세요.\n\n🔗 silvertape.art\n\n#첫구매할인 #SILVERTAPE #웰컴혜택 #아트포스터 #뉴스레터 #할인'
  },
  { num: 21, category: 'PROMO', bg: '#0a0a0a', accent: '#FF69B4',
    headline: '2장 이상\n구매 시\n추가 할인',
    sub: 'Bundle & Save — 벽을 채울수록 이득',
    body: '포스터는 하나보다 둘이,\n둘보다 셋이 낫습니다.\n갤러리 월을 완성하세요.',
    cta: '번들 혜택 보기 →', tag: '#번들할인 #갤러리월',
    caption: '🖼🖼 2장 이상 구매 시 추가 할인\n\n포스터는 하나보다 둘이,\n둘보다 셋이 낫습니다.\n\n벽을 채울수록 이득.\n나만의 갤러리 월을 완성하세요.\n\n🔗 silvertape.art\n\n#번들할인 #갤러리월 #SILVERTAPE #아트포스터 #벽꾸미기 #인테리어'
  },
  { num: 22, category: 'PROMO', bg: '#111', accent: '#9370DB',
    headline: 'RESTOCK\nALERT',
    sub: '재입고 알림 — 품절작 복귀',
    body: '요청이 많았던 작품이 돌아왔습니다.\n이번에도 한정 수량.\n놓치지 마세요.',
    cta: '재입고 작품 보기 →', tag: '#Restock #재입고',
    caption: '🔔 RESTOCK ALERT\n\n요청이 많았던 작품이 돌아왔습니다.\n이번에도 한정 수량.\n\n놓치지 마세요.\n\n🔗 silvertape.art\n\n#Restock #재입고 #SILVERTAPE #아트포스터 #한정수량 #품절작복귀'
  },
  { num: 23, category: 'PROMO', bg: '#0f0f0f', accent: '#F0E68C',
    headline: '주간 큐레이션\n에디터 PICK',
    sub: "Editor's Choice — 이번 주의 선택",
    body: '수십 개 작품 중\n에디터가 직접 고른 한 장.\n매주 월요일 업데이트.',
    cta: '에디터 PICK 보기 →', tag: '#EditorPick #큐레이션',
    caption: '✨ 에디터 PICK — 이번 주의 선택\n\n수십 개 작품 중\n에디터가 직접 고른 한 장.\n\n매주 월요일 업데이트.\n\n🔗 silvertape.art\n\n#EditorPick #큐레이션 #SILVERTAPE #아트포스터 #이번주추천 #에디터추천'
  },
  // === 아트/교육 콘텐츠 (24-28) ===
  { num: 24, category: 'CONTENT', bg: '#0a0a0a', accent: '#FF8C00',
    headline: '좋은 포스터를\n고르는 법',
    sub: 'How to Choose Art for Your Wall',
    body: '① 공간의 톤과 어울리는 색감\n② 시선이 자연스럽게 머무는 구도\n③ 오래 봐도 질리지 않는 주제\n④ 프린트 품질과 용지 확인\n⑤ 직감을 믿으세요',
    cta: '큐레이션 둘러보기 →', tag: '#포스터고르는법 #아트가이드',
    caption: '🎯 좋은 포스터를 고르는 법\n\n① 공간의 톤과 어울리는 색감\n② 시선이 자연스럽게 머무는 구도\n③ 오래 봐도 질리지 않는 주제\n④ 프린트 품질과 용지 확인\n⑤ 직감을 믿으세요\n\n결국 마지막은 직감입니다.\n\n🔗 silvertape.art\n\n#포스터고르는법 #아트가이드 #SILVERTAPE #인테리어팁 #아트포스터 #공간큐레이션'
  },
  { num: 25, category: 'CONTENT', bg: '#111', accent: '#20B2AA',
    headline: '포스터\n사이즈\n가이드',
    sub: 'Size Guide — 어떤 크기가 맞을까?',
    body: 'A4 (21×30cm): 책상·선반 위\nA3 (30×42cm): 원룸·작은 벽\nA2 (42×59cm): 거실·침실 벽\nA1 (59×84cm): 대형 벽·상업 공간',
    cta: '사이즈별 작품 보기 →', tag: '#사이즈가이드 #포스터',
    caption: '📏 포스터 사이즈 가이드\n\n어떤 크기가 맞을까?\n\n🔹 A4 (21×30cm) → 책상, 선반 위\n🔹 A3 (30×42cm) → 원룸, 작은 벽\n🔹 A2 (42×59cm) → 거실, 침실 벽\n🔹 A1 (59×84cm) → 대형 벽, 상업 공간\n\n🔗 silvertape.art\n\n#사이즈가이드 #포스터사이즈 #SILVERTAPE #아트포스터 #인테리어팁'
  },
  { num: 26, category: 'CONTENT', bg: '#0d0d0d', accent: '#DA70D6',
    headline: 'AI 아트는\n예술인가?',
    sub: 'AI Art — 도구인가, 예술가인가?',
    body: '카텔란의 바나나가 예술이 되었듯이,\nAI가 만든 이미지도 예술이 될 수 있다.\n중요한 건 도구가 아니라 감각이다.',
    cta: 'AI 아트 컬렉션 →', tag: '#AI아트 #디지털아트',
    caption: '🤖 AI 아트는 예술인가?\n\n카텔란의 바나나가 예술이 되었듯이,\nAI가 만든 이미지도 예술이 될 수 있습니다.\n\n중요한 건 도구가 아니라 감각.\nSILVERTAPE의 스튜디오들은\nAI를 도구로 쓰되, 감각으로 큐레이션합니다.\n\n🔗 silvertape.art\n\n#AI아트 #디지털아트 #SILVERTAPE #현대미술 #아트포스터'
  },
  { num: 27, category: 'CONTENT', bg: '#0a0a0a', accent: '#F4A460',
    headline: '포스터\n걸기 팁',
    sub: 'How to Hang — 프로처럼 걸기',
    body: '눈높이에서 약간 아래 (150cm)\n가구와 15~25cm 간격 유지\n복수 작품: 중심축 맞추기\n조명은 위에서 비추기\n벽 색상과 대비 활용',
    cta: '#포스터걸기팁', tag: '#인테리어팁 #걸기가이드',
    caption: '🔨 포스터 프로처럼 걸기\n\n① 눈높이에서 약간 아래 (150cm)\n② 가구와 15~25cm 간격 유지\n③ 복수 작품: 중심축 맞추기\n④ 조명은 위에서 비추기\n⑤ 벽 색상과 대비 활용\n\n🔗 silvertape.art\n\n#포스터걸기팁 #인테리어팁 #SILVERTAPE #벽꾸미기 #아트포스터'
  },
  { num: 28, category: 'CONTENT', bg: '#111', accent: '#00FA9A',
    headline: '컬러로\n분위기\n바꾸기',
    sub: 'Color Mood — 색상이 공간을 지배한다',
    body: '따뜻한 톤: 아늑함, 편안함\n차가운 톤: 세련됨, 집중\n모노톤: 고급스러움, 미니멀\n비비드: 에너지, 개성',
    cta: '컬러별 작품 보기 →', tag: '#컬러무드 #인테리어컬러',
    caption: '🎨 컬러로 분위기 바꾸기\n\n🔴 따뜻한 톤 → 아늑함, 편안함\n🔵 차가운 톤 → 세련됨, 집중\n⬛ 모노톤 → 고급스러움, 미니멀\n🟡 비비드 → 에너지, 개성\n\n당신의 공간은 어떤 색을 원하나요?\n\n🔗 silvertape.art\n\n#컬러무드 #인테리어컬러 #SILVERTAPE #아트포스터 #공간디자인'
  },
  // === 제품 하이라이트 (29-30) ===
  { num: 29, category: 'PRODUCT', bg: '#0a0a0a', accent: '#C0C0C0',
    headline: 'Helvetica\nStrike',
    sub: 'SENSIBILITY STAIR — Exclusive',
    body: '타이포그래피가 예술이 되는 순간.\n헬베티카의 정밀함과\n파괴적 에너지의 충돌.\n₩112,000 · Exclusive',
    cta: '작품 상세보기 →', tag: '#HelveticaStrike #타이포아트',
    caption: '🔤 Helvetica Strike\nby SENSIBILITY STAIR\n\n타이포그래피가 예술이 되는 순간.\n헬베티카의 정밀함과 파괴적 에너지의 충돌.\n\nExclusive · ₩112,000\n\n🔗 silvertape.art/studio/sensibility/helvetica-strike\n\n#HelveticaStrike #타이포아트 #SENSIBILITY #SILVERTAPE #Exclusive #아트포스터'
  },
  { num: 30, category: 'BRAND', bg: '#0a0a0a', accent: '#C0C0C0',
    headline: 'SILVER\nTAPE',
    sub: 'Curated Art. Every Wall.',
    body: '당신의 벽 위에,\n단단하게 고정합니다.\n\nsilvertape.art',
    cta: 'Follow @silvertape.art', tag: '#SILVERTAPE',
    caption: 'SILVERTAPE\nCurated Art. Every Wall.\n\n당신의 벽 위에,\n단단하게 고정합니다.\n\nFollow for art. Follow for walls.\n\n🔗 silvertape.art\n\n#SILVERTAPE #CuratedArt #EveryWall #아트포스터 #아트플랫폼 #인테리어아트 #포스터샵'
  },
];

function generateCard(c) {
  const lines = c.headline.split('\n');
  const bodyLines = c.body.split('\n');
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;700;900&family=Space+Grotesk:wght@400;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1080px; height: 1080px; background: ${c.bg}; color: #fff; font-family: 'Noto Sans KR', sans-serif; display: flex; flex-direction: column; overflow: hidden; position: relative; }
  .border { position: absolute; inset: 24px; border: 1px solid rgba(255,255,255,0.08); border-radius: 2px; pointer-events: none; }
  .inner { padding: 64px 72px; display: flex; flex-direction: column; height: 100%; position: relative; z-index: 1; }
  .top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 48px; }
  .logo { font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 700; letter-spacing: 4px; color: rgba(255,255,255,0.5); }
  .cat { font-size: 12px; font-weight: 700; letter-spacing: 3px; color: ${c.accent}; text-transform: uppercase; }
  .headline { font-size: 72px; font-weight: 900; line-height: 1.1; letter-spacing: -2px; margin-bottom: 20px; }
  .headline .accent { color: ${c.accent}; }
  .sub { font-size: 18px; font-weight: 300; color: rgba(255,255,255,0.5); margin-bottom: 48px; letter-spacing: 0.5px; }
  .body { font-size: 20px; font-weight: 300; line-height: 1.8; color: rgba(255,255,255,0.75); flex: 1; }
  .bottom { margin-top: auto; padding-top: 36px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; }
  .cta { font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 700; color: ${c.accent}; letter-spacing: 1px; }
  .tag { font-size: 13px; color: rgba(255,255,255,0.3); }
  .dot { position: absolute; width: 6px; height: 6px; border-radius: 50%; background: ${c.accent}; }
  .dot-tl { top: 48px; left: 48px; }
  .dot-br { bottom: 48px; right: 48px; }
</style></head>
<body>
  <div class="border"></div>
  <div class="dot dot-tl"></div>
  <div class="dot dot-br"></div>
  <div class="inner">
    <div class="top">
      <span class="logo">SILVERTAPE</span>
      <span class="cat">${c.category}</span>
    </div>
    <div class="headline">${lines.map((l, i) => i === 0 ? `<span class="accent">${l}</span>` : l).join('<br>')}</div>
    <div class="sub">${c.sub}</div>
    <div class="body">${bodyLines.join('<br>')}</div>
    <div class="bottom">
      <span class="cta">${c.cta}</span>
      <span class="tag">${c.tag}</span>
    </div>
  </div>
</body></html>`;
}

for (const c of cards) {
  const num = String(c.num).padStart(2, '0');
  const slug = c.headline.split('\n')[0].replace(/[\/\\:*?"<>|.\s]+/g, '-').replace(/-+$/, '');
  writeFileSync(join(OUT, `${num}-${slug}.html`), generateCard(c));
}

// captions file
const captionsMarkdown = cards.map(c => {
  const num = String(c.num).padStart(2, '0');
  return `## ${num}. ${c.headline.split('\n')[0]} — ${c.category}\n\n${c.caption}\n\n---`;
}).join('\n\n');

writeFileSync(join(import.meta.dirname || '.', 'captions.md'), `# SILVERTAPE 인스타그램 광고 캡션 30개\n\n> @silvertape.art 피드용 — 복사해서 바로 사용하세요\n\n---\n\n${captionsMarkdown}\n`);

// index
const indexHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>SILVERTAPE — Instagram Ad Cards</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&family=Space+Grotesk:wght@400;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Noto Sans KR', sans-serif; background: #0a0a0a; color: #fff; padding: 40px; }
  h1 { font-family: 'Space Grotesk', sans-serif; text-align: center; font-size: 32px; letter-spacing: 6px; margin-bottom: 8px; }
  .sub { text-align: center; color: #666; margin-bottom: 40px; font-size: 14px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; max-width: 1400px; margin: 0 auto; }
  .card { display: block; text-decoration: none; border-radius: 4px; overflow: hidden; aspect-ratio: 1; position: relative; transition: transform 0.2s; border: 1px solid rgba(255,255,255,0.06); }
  .card:hover { transform: scale(1.02); border-color: rgba(255,255,255,0.15); }
  .card-inner { width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; padding: 28px; }
  .card .cat { font-size: 10px; letter-spacing: 2px; color: #666; margin-bottom: 8px; }
  .card .title { font-size: 20px; font-weight: 900; color: #fff; line-height: 1.2; margin-bottom: 6px; }
  .card .num { font-size: 11px; color: #444; margin-top: auto; }
</style></head>
<body>
<h1>SILVERTAPE</h1>
<p class="sub">인스타그램 피드 광고 카드뉴스 30장 — 각 카드를 클릭하면 1080×1080 원본</p>
<div class="grid">
${cards.map(c => {
  const num = String(c.num).padStart(2, '0');
  const slug = c.headline.split('\n')[0].replace(/[\/\\:*?"<>|.\s]+/g, '-').replace(/-+$/, '');
  return `  <a class="card" href="cards/${num}-${slug}.html" target="_blank" style="background:${c.bg}">
    <div class="card-inner">
      <div class="cat" style="color:${c.accent}">${c.category}</div>
      <div class="title">${c.headline.split('\n')[0]}</div>
      <div class="num">${num}/30</div>
    </div>
  </a>`;
}).join('\n')}
</div>
</body></html>`;

writeFileSync(join(import.meta.dirname || '.', 'index.html'), indexHtml);
console.log('✅ 30 SILVERTAPE ad cards generated');
console.log('📄 Gallery: output/silvertape-ads/index.html');
console.log('📝 Captions: output/silvertape-ads/captions.md');
