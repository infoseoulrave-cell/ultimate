import express from 'express';
import { getConfig, ensureLogDir } from './config.js';
import { getSystemPrompt, getGoalSystemPrompt } from './persona.js';
import { getCharacter } from './characters.js';
import { chat } from './brain.js';

const HTML = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ultimate Agent - Desktop App</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            'ultimate-blue': '#00AAFF',
            'user-green': '#10B981',
            'goal-yellow': '#FCD34D'
          }
        }
      }
    }
  </script>
</head>
<body class="bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 min-h-screen p-4 md:p-8 font-sans">
  <div class="max-w-4xl mx-auto">
    <header class="text-center mb-8">
      <h1 class="text-4xl md:text-5xl font-bold bg-gradient-to-r from-ultimate-blue to-blue-400 bg-clip-text text-transparent mb-2">Ultimate Agent</h1>
      <p class="text-xl text-gray-400 mb-4">로컬 에이전트 데스크톱 앱 | 턴보 Goal Mode 지원</p>
      <div class="flex flex-col md:flex-row gap-4 justify-center">
        <div class="text-sm text-gray-500">
          캐릭터: Nexus, 세리, 턴보 | Goal Mode로 복잡 목표 달성
        </div>
      </div>
    </header>
    
    <!-- Goal Mode Section -->
    <div id="goal-section" class="mb-6 p-6 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 backdrop-blur-md rounded-2xl border-2 border-goal-yellow/30 shadow-2xl">
      <h2 class="text-2xl font-bold text-goal-yellow mb-4 text-center">🎯 Goal Mode (턴보)</h2>
      <div class="flex gap-3">
        <input id="goal-input" type="text" placeholder="목표 입력: 우리 프로그램을 어플리케이션으로 만들어줘" 
               class="flex-1 bg-gray-700/50 backdrop-blur-sm border border-goal-yellow/50 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-goal-yellow focus:border-transparent text-lg placeholder-gray-400 transition-all">
        <button id="goal-btn" class="bg-gradient-to-r from-goal-yellow to-orange-500 hover:from-orange-400 hover:to-goal-yellow px-8 py-4 rounded-xl font-bold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all whitespace-nowrap">
          Goal 시작
        </button>
      </div>
      <div id="goal-status" class="mt-3 text-sm text-gray-400 text-center hidden">목표 진행 중...</div>
    </div>
    
    <div id="chat-container" class="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-2xl border border-gray-700 mb-6 h-96 md:h-[500px] overflow-y-auto space-y-4 scroll-smooth">
    </div>
    
    <div class="flex gap-4">
      <input id="message-input" type="text" placeholder="일반 채팅 (Enter 전송)..." 
             class="flex-1 bg-gray-700/50 backdrop-blur-sm border border-gray-600 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-ultimate-blue focus:border-transparent text-lg placeholder-gray-400 transition-all duration-200">
      <button id="send-btn" class="bg-gradient-to-r from-ultimate-blue to-blue-500 hover:from-blue-500 hover:to-ultimate-blue px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap">
        전송
      </button>
    </div>
    
    <div class="mt-8 text-center text-sm text-gray-500 space-y-1">
      <p>명령어: /help | 로컬 파일 수정, 인터넷 검색, OpenClaw 연동 가능</p>
      <p class="text-xs">API 키: ~/.ultimate/config.json | Dev: F12</p>
    </div>
  </div>

  <script>
    const chatContainer = document.getElementById('chat-container');
    const input = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const goalInput = document.getElementById('goal-input');
    const goalBtn = document.getElementById('goal-btn');
    const goalStatus = document.getElementById('goal-status');
    let history = [];
    let isGoalMode = false;

    function addMessage(content, isUser, timestamp, isGoal = false) {
      if (timestamp === undefined) timestamp = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
      const wrap = document.createElement('div');
      wrap.className = 'flex ' + (isUser ? 'justify-end' : 'justify-start');
      const bubble = document.createElement('div');
      let bgClass = isUser ? 'bg-user-green/20 border border-user-green/30 rounded-bl-md' : 'bg-ultimate-blue/20 border border-ultimate-blue/30 rounded-br-md';
      if (isGoal) bgClass = isUser ? bgClass : 'bg-goal-yellow/20 border border-goal-yellow/30 rounded-br-md';
      bubble.className = bgClass + ' p-4 rounded-2xl max-w-xs md:max-w-md shadow-lg';
      const timeEl = document.createElement('div');
      timeEl.className = 'text-xs text-gray-400 mb-1';
      timeEl.textContent = '[' + timestamp + ']';
      const contentEl = document.createElement('div');
      contentEl.textContent = content;
      const labelEl = document.createElement('div');
      labelEl.className = 'text-xs text-gray-500 mt-2 font-mono';
      labelEl.textContent = isUser ? 'You' : (isGoal ? '턴보 (Goal)' : 'Ultimate');
      bubble.appendChild(timeEl);
      bubble.appendChild(contentEl);
      bubble.appendChild(labelEl);
      wrap.appendChild(bubble);
      chatContainer.appendChild(wrap);
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async function sendMessage() {
      const content = input.value.trim();
      if (!content) return;
      addMessage(content, true);
      input.value = '';
      sendBtn.textContent = '전송 중...';
      sendBtn.disabled = true;
      try {
        history.push({ role: 'user', content });
        const endpoint = isGoalMode ? '/api/goal' : '/api/chat';
        const body = isGoalMode ? { goal: content, history } : { history };
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!res.ok) {
          addMessage('오류: ' + (data.error || res.status), false);
          history.pop();
        } else if (data.content != null) {
          addMessage(data.content, false, undefined, isGoalMode);
          history.push({ role: 'assistant', content: data.content });
          if (data.goalDone) {
            isGoalMode = false;
            goalStatus.textContent = data.goalSummary || '목표 완료!';
            goalStatus.classList.remove('hidden', 'text-yellow-400');
            goalStatus.classList.add('text-green-400');
            goalBtn.textContent = 'Goal 완료! 다음 목표';
          }
        }
      } catch (e) {
        addMessage('오류: ' + (e.message || '네트워크 오류'), false);
        history.pop();
      }
      sendBtn.textContent = '전송';
      sendBtn.disabled = false;
    }

    async function sendGoal() {
      const goal = goalInput.value.trim();
      if (!goal) return;
      isGoalMode = true;
      goalStatus.textContent = '목표 진행 중... 턴보가 처리합니다.';
      goalStatus.classList.remove('hidden');
      goalInput.value = '';
      addMessage(goal, true);
      history.push({ role: 'user', content: goal });
      goalBtn.textContent = 'Goal 진행 중...';
      goalBtn.disabled = true;
      // sendMessage() 가 호출되도록 input.value = goal; 하지만 별도
      await sendMessage(); // 재사용
    }

    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
    sendBtn.addEventListener('click', sendMessage);
    goalBtn.addEventListener('click', sendGoal);
    goalInput.addEventListener('keypress', (e) => { 
      if (e.key === 'Enter') sendGoal(); 
    });

    // 초기 메시지
    addMessage('Ultimate 데스크톱 앱에 오신 걸 환영합니다! Goal Mode로 복잡한 작업을 맡겨보세요. 😊', false);
  </script>
</body>
</html>
`;

export function startWebServer(config = {}) {
  const app = express();
  const port = 3000;
  const cfg = { ...getConfig(), ...config };
  ensureLogDir(cfg.home);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/chat', (req, res) => {
    res.send(HTML);
  });

  app.get('/', (req, res) => {
    res.redirect('/chat');
  });

  app.post('/api/chat', async (req, res) => {
    if (!cfg.apiKey) {
      return res.status(500).json({ error: 'API 키가 없습니다. ~/.ultimate/config.json 또는 환경변수를 설정하세요.' });
    }
    const history = Array.isArray(req.body?.history) ? req.body.history : [];
    const charId = cfg.character || 'nexus';
    const systemContent = getSystemPrompt(cfg.home, charId);
    const messages = [
      { role: 'system', content: systemContent },
      ...history.slice(-24),
    ];
    try {
      const out = await chat(messages, cfg, null, null, null);
      res.json({ content: out?.content ?? '' });
    } catch (e) {
      res.status(500).json({ error: e.message || String(e) });
    }
  });

  // Goal Mode API (턴보, goalMode: true)
  app.post('/api/goal', async (req, res) => {
    if (!cfg.apiKey) {
      return res.status(500).json({ error: 'API 키가 없습니다.' });
    }
    const goal = req.body.goal?.trim();
    const history = Array.isArray(req.body?.history) ? req.body.history : [];
    if (!goal) return res.status(400).json({ error: '목표를 입력하세요.' });
    
    const charId = 'turnbo';  // Goal은 턴보
    const systemContent = getGoalSystemPrompt(cfg.home, charId, goal, process.cwd());
    const messages = [
      { role: 'system', content: systemContent },
      { role: 'user', content: '이 목표를 달성할 때까지 단계별로 진행해줘. 실패하면 다른 방법을 시도해.' },
      ...history.slice(-10).filter(m => m.role === 'assistant'),  // 최근 history 병합
    ];
    
    const runConfig = { ...cfg, goalMode: true };
    try {
      const out = await chat(messages, runConfig, null, null, null);
      const response = {
        content: out.content || '',
        goalDone: out.goalDone || false,
        goalResult: out.goalResult,
        goalSummary: out.goalSummary
      };
      res.json(response);
    } catch (e) {
      res.status(500).json({ error: e.message || String(e) });
    }
  });

  const server = app.listen(port, 'localhost', () => {
    console.log(`\\n🚀 Ultimate Web Server @ http://localhost:${port}`);
  });

  app.server = server;
  return app;
}
