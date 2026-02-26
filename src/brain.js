import { TOOL_DEFINITIONS, TOOL_DEFINITIONS_GOAL, runTool } from './tools/index.js';

function accumulateStream(res, onChunk) {
  return new Promise((resolve, reject) => {
    let content = '';
    const toolCallsByIndex = new Map();
    let finishReason = null;

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';

    function processLine(line) {
      if (line.startsWith('data: ')) line = line.slice(6);
      if (line === '[DONE]' || !line.trim()) return;
      try {
        const data = JSON.parse(line);
        const choice = data.choices?.[0];
        if (!choice) return;
        const d = choice.delta || {};
        finishReason = choice.finish_reason ?? finishReason;
        if (d.content != null && d.content !== '') {
          content += d.content;
          if (onChunk) onChunk(d.content);
        }
        if (d.tool_calls?.length) {
          for (const tc of d.tool_calls) {
            const i = tc.index ?? 0;
            if (!toolCallsByIndex.has(i)) toolCallsByIndex.set(i, { id: tc.id || '', name: '', arguments: '' });
            const acc = toolCallsByIndex.get(i);
            if (tc.id) acc.id = tc.id;
            if (tc.function?.name) acc.name = tc.function.name;
            if (tc.function?.arguments) acc.arguments += tc.function.arguments;
          }
        }
      } catch (_) {}
    }

    function read() {
      reader.read().then(({ done, value }) => {
        if (done) {
          resolve({
            content: content.trim(),
            finishReason,
            toolCalls: toolCallsByIndex.size
              ? Array.from(toolCallsByIndex.entries())
                  .sort((a, b) => a[0] - b[0])
                  .map(([, v]) => ({ id: v.id, name: v.name, arguments: v.arguments }))
              : null,
          });
          return;
        }
        buf += dec.decode(value, { stream: true });
        const lines = buf.split(/\n/);
        buf = lines.pop() || '';
        for (const line of lines) processLine(line);
        read();
      }, reject);
    }
    read();
  });
}

async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let res;
    try {
      res = await fetch(url, options);
    } catch (e) {
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw new Error(`네트워크 연결 실패 (${maxRetries + 1}회 시도): ${e?.message || String(e)}`);
    }
    if (res.ok) return res;
    if ((res.status === 429 || res.status >= 500) && attempt < maxRetries) {
      const retryAfter = Number(res.headers.get('retry-after')) || Math.pow(2, attempt + 1);
      const delay = Math.min(retryAfter * 1000, 30000);
      await new Promise(r => setTimeout(r, delay));
      continue;
    }
    return res;
  }
}

export async function chat(messages, config, onToolUse, onChunk, onToolRoundStart) {
  const { apiKey, apiBase, model, openclawPath, allowDirs, home, fetchTimeout, maxFetchBytes } = config;
  const goalMode = config.goalMode === true;
  const maxToolRounds = goalMode ? (config.maxGoalRounds ?? 50) : (config.maxToolRounds ?? 10);
  if (!apiKey) throw new Error('Missing API key. Set OPENAI_API_KEY or ULTIMATE_API_KEY or apiKey in ~/.ultimate/config.json');

  const url = `${apiBase.replace(/\/$/, '')}/chat/completions`;
  const ctx = { openclawPath, allowDirs, home, fetchTimeout, maxFetchBytes, openclawTimeout: config.openclawTimeout };
  let current = [...messages];

  function getLastUserContent(msgs) {
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user' && msgs[i].content) return String(msgs[i].content).trim();
    }
    return '';
  }
  let rounds = 0;
  const stream = Boolean(onChunk);
  const tools = goalMode ? TOOL_DEFINITIONS_GOAL : TOOL_DEFINITIONS;

  while (rounds < maxToolRounds) {
    const body = {
      model,
      messages: current,
      stream,
      tools: tools.length ? tools : undefined,
    };
    const res = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    }, goalMode ? 5 : 3);
    if (!res.ok) {
      const t = await res.text();
      let msg = `API error ${res.status}`;
      try {
        const j = JSON.parse(t);
        const err = j?.error?.message ?? j?.message ?? t?.slice(0, 200);
        if (res.status === 401) msg = 'API 키가 잘못되었거나 만료되었습니다. config 또는 환경변수를 확인하세요.';
        else if (res.status === 429) msg = '요청 한도를 초과했습니다. 잠시 후 다시 시도하세요.';
        else if (res.status >= 500) msg = 'API 서버 오류입니다. 잠시 후 다시 시도하세요.';
        else if (err && typeof err === 'string' && err.length < 120) msg = err;
      } catch (_) {}
      throw new Error(msg);
    }

    if (stream && res.body) {
      const { content, toolCalls } = await accumulateStream(res, onChunk);
      if (toolCalls?.length) {
        if (onToolRoundStart) onToolRoundStart(toolCalls.map((tc) => tc.name));
        ctx.lastUserContent = getLastUserContent(current);
        const toolResults = [];
        let goalFinished = null;
        for (const tc of toolCalls) {
          const name = tc.name;
          let args = {};
          try {
            args = JSON.parse(tc.arguments || '{}');
          } catch (_) {}
          let result;
          try {
            result = await runTool(name, args, ctx);
          } catch (e) {
            result = { error: (e && e.message) || String(e) };
          }
          if (result && result._goalFinished) {
            goalFinished = { result: result.result, summary: result.summary };
            result = { ok: true, result: result.result, summary: result.summary };
          }
          const resultStr = typeof result === 'string' ? result : JSON.stringify(result);
          if (onToolUse) onToolUse({ name, args, result: resultStr });
          toolResults.push({ role: 'tool', tool_call_id: tc.id, content: resultStr });
        }
        if (goalFinished) return { content, goalDone: true, goalResult: goalFinished.result, goalSummary: goalFinished.summary };
        current = [
          ...current,
          {
            role: 'assistant',
            content: content || null,
            tool_calls: toolCalls.map((tc) => ({ id: tc.id, type: 'function', function: { name: tc.name, arguments: tc.arguments } })),
          },
          ...toolResults,
        ];
        rounds++;
        continue;
      }
      return { content, finishReason: 'stop' };
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    if (!choice) throw new Error('No choice in API response');
    const delta = choice.message;

    if (delta.tool_calls?.length) {
      if (onToolRoundStart) onToolRoundStart(delta.tool_calls.map((tc) => tc.function?.name).filter(Boolean));
      ctx.lastUserContent = getLastUserContent(current);
      const toolResults = [];
      let goalFinished = null;
      for (const tc of delta.tool_calls) {
        const name = tc.function?.name;
        let args = {};
        try {
          args = JSON.parse(tc.function?.arguments || '{}');
        } catch (_) {}
        let result;
        try {
          result = await runTool(name, args, ctx);
        } catch (e) {
          result = { error: (e && e.message) || String(e) };
        }
        if (result && result._goalFinished) {
          goalFinished = { result: result.result, summary: result.summary };
          result = { ok: true, result: result.result, summary: result.summary };
        }
        const resultStr = typeof result === 'string' ? result : JSON.stringify(result);
        if (onToolUse) onToolUse({ name, args, result: resultStr });
        toolResults.push({ role: 'tool', tool_call_id: tc.id, content: resultStr });
      }
      if (goalFinished) return { content: '', goalDone: true, goalResult: goalFinished.result, goalSummary: goalFinished.summary };
      const normalizedToolCalls = (delta.tool_calls || []).map((tc) => ({
        id: tc.id,
        type: 'function',
        function: { name: tc.function?.name, arguments: tc.function?.arguments || '{}' },
      }));
      current = [
        ...current,
        { role: 'assistant', content: null, tool_calls: normalizedToolCalls },
        ...toolResults,
      ];
      rounds++;
      continue;
    }

    const content = delta.content?.trim() ?? '';
    return { content, finishReason: choice.finish_reason };
  }

  if (goalMode) {
    return { content: '(도구 호출 한도에 도달했지만 목표를 향해 최대한 진행했습니다. 지금까지의 진행 상황을 확인하세요.)', finishReason: 'length' };
  }
  return { content: '(도구 호출 한도에 도달했습니다. 요약만 드립니다.)', finishReason: 'length' };
}
