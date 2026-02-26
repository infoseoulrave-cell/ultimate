export const SKILL_META = {
  name: 'notion',
  description: 'Notion workspace operations: create pages, search pages, add content, list databases. Requires NOTION_API_KEY env var. Actions: search, create_page, append_content, list_databases.',
  category: 'productivity',
  parameters: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['search', 'create_page', 'append_content', 'list_databases'], description: 'Action to perform' },
      query: { type: 'string', description: 'Search query' },
      title: { type: 'string', description: 'Page title' },
      content: { type: 'string', description: 'Page content (markdown-like)' },
      parent_id: { type: 'string', description: 'Parent page or database ID' },
      page_id: { type: 'string', description: 'Page ID for append_content' },
    },
    required: ['action'],
  },
};

const API_BASE = 'https://api.notion.com/v1';

async function notionApi(method, path, body = null) {
  const token = process.env.NOTION_API_KEY || process.env.NOTION_TOKEN || '';
  if (!token) return { error: 'NOTION_API_KEY not set. Get it from https://www.notion.so/my-integrations' };

  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
  };
  if (body) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(`${API_BASE}${path}`, opts);
    const data = await res.json();
    if (!res.ok) return { error: data.message || `Notion API error ${res.status}` };
    return data;
  } catch (e) {
    return { error: `Notion API failed: ${e.message}` };
  }
}

function textToBlocks(text) {
  return (text || '').split('\n').filter(Boolean).map(line => ({
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [{ type: 'text', text: { content: line.slice(0, 2000) } }],
    },
  }));
}

export async function execute(args) {
  const { action } = args;

  switch (action) {
    case 'search': {
      const result = await notionApi('POST', '/search', {
        query: args.query || '',
        page_size: 10,
      });
      if (result.error) return result;
      const pages = (result.results || []).map(p => ({
        id: p.id,
        title: p.properties?.title?.title?.[0]?.plain_text || p.properties?.Name?.title?.[0]?.plain_text || '(no title)',
        url: p.url,
        type: p.object,
        lastEdited: p.last_edited_time,
      }));
      return { ok: true, pages, total: result.results?.length || 0 };
    }
    case 'create_page': {
      if (!args.title) return { error: 'title is required' };
      const body = {
        parent: args.parent_id
          ? { page_id: args.parent_id }
          : { type: 'page_id', page_id: args.parent_id || '' },
        properties: {
          title: { title: [{ text: { content: args.title } }] },
        },
      };
      if (args.content) body.children = textToBlocks(args.content);

      if (!args.parent_id) {
        return { error: 'parent_id is required. Use search or list_databases to find a parent page/database ID.' };
      }
      const result = await notionApi('POST', '/pages', body);
      if (result.error) return result;
      return { ok: true, id: result.id, url: result.url, title: args.title };
    }
    case 'append_content': {
      if (!args.page_id || !args.content) return { error: 'page_id and content are required' };
      const result = await notionApi('PATCH', `/blocks/${args.page_id}/children`, {
        children: textToBlocks(args.content),
      });
      if (result.error) return result;
      return { ok: true, blocksAdded: result.results?.length || 0 };
    }
    case 'list_databases': {
      const result = await notionApi('POST', '/search', {
        filter: { property: 'object', value: 'database' },
        page_size: 20,
      });
      if (result.error) return result;
      const dbs = (result.results || []).map(d => ({
        id: d.id,
        title: d.title?.[0]?.plain_text || '(no title)',
        url: d.url,
      }));
      return { ok: true, databases: dbs };
    }
    default:
      return { error: `Unknown action: ${action}` };
  }
}
