export const SKILL_META = {
  name: 'web_search',
  description: 'Search the web using multiple engines. Returns relevant results with titles, URLs, and snippets. Useful for finding current information, documentation, tutorials, etc.',
  category: 'web',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      num_results: { type: 'number', description: 'Number of results (default 5, max 10)' },
    },
    required: ['query'],
  },
};

async function duckDuckGoSearch(query, num) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; UltimateAgent/1.0)' },
      redirect: 'follow',
    });
    const html = await res.text();
    const results = [];
    const regex = /<a rel="nofollow" class="result__a" href="([^"]+)"[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    let match;
    while ((match = regex.exec(html)) && results.length < num) {
      const href = match[1].replace(/\/\/duckduckgo\.com\/l\/\?uddg=/, '').split('&')[0];
      const title = match[2].replace(/<[^>]+>/g, '').trim();
      const snippet = match[3].replace(/<[^>]+>/g, '').trim();
      if (href && title) {
        results.push({ title, url: decodeURIComponent(href), snippet });
      }
    }
    return results;
  } catch (_) {
    return [];
  }
}

async function googleScrape(query, num) {
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=${num}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36' },
    });
    const html = await res.text();
    const results = [];
    const regex = /<a href="\/url\?q=([^&]+)&amp;[^"]*"[^>]*><h3[^>]*>([^<]+)<\/h3>/g;
    let match;
    while ((match = regex.exec(html)) && results.length < num) {
      results.push({ title: match[2], url: decodeURIComponent(match[1]), snippet: '' });
    }
    return results;
  } catch (_) {
    return [];
  }
}

export async function execute(args) {
  const query = args?.query?.trim();
  if (!query) return { error: 'query is required' };
  const num = Math.min(Number(args?.num_results) || 5, 10);

  let results = await duckDuckGoSearch(query, num);

  if (!results.length) {
    results = await googleScrape(query, num);
  }

  if (!results.length) {
    return { ok: true, results: [], message: 'No results found. Try a different query or use fetch_url directly.' };
  }

  return { ok: true, query, results, count: results.length };
}
