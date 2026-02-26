import { execSync } from 'child_process';

export const SKILL_META = {
  name: 'github',
  description: 'GitHub operations: create/list repos, issues, PRs, search code. Uses GitHub CLI (gh) or API. Actions: list_repos, create_issue, list_issues, create_pr, search_code, repo_info.',
  category: 'development',
  parameters: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['list_repos', 'create_issue', 'list_issues', 'create_pr', 'search_code', 'repo_info'], description: 'Action to perform' },
      repo: { type: 'string', description: 'Repository (owner/name)' },
      title: { type: 'string', description: 'Title for issue/PR' },
      body: { type: 'string', description: 'Body text for issue/PR' },
      query: { type: 'string', description: 'Search query' },
      branch: { type: 'string', description: 'Branch name for PR' },
      base: { type: 'string', description: 'Base branch for PR (default: main)' },
    },
    required: ['action'],
  },
};

function gh(args, timeout = 30000) {
  try {
    return execSync(`gh ${args}`, { encoding: 'utf8', timeout, maxBuffer: 1024 * 1024 }).trim();
  } catch (e) {
    return null;
  }
}

function ghApi(path, method = 'GET', body = null) {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
  if (!token) return null;
  const args = [`-H "Authorization: token ${token}"`, `-H "Accept: application/vnd.github.v3+json"`, `https://api.github.com${path}`];
  if (method !== 'GET') args.unshift(`-X ${method}`);
  if (body) args.push(`-d '${JSON.stringify(body)}'`);
  try {
    const out = execSync(`curl -s ${args.join(' ')}`, { encoding: 'utf8', timeout: 15000 });
    return JSON.parse(out);
  } catch (_) {
    return null;
  }
}

export async function execute(args) {
  const { action, repo, title, body, query, branch, base } = args;

  switch (action) {
    case 'list_repos': {
      const out = gh('repo list --limit 20 --json name,description,url,isPrivate');
      if (!out) return { error: 'gh CLI not available or not authenticated. Run: gh auth login' };
      try { return { ok: true, repos: JSON.parse(out) }; } catch (_) { return { ok: true, raw: out }; }
    }
    case 'repo_info': {
      if (!repo) return { error: 'repo is required (e.g. owner/name)' };
      const out = gh(`repo view ${repo} --json name,description,url,defaultBranchRef,stargazerCount,forkCount,issues,pullRequests`);
      if (!out) return { error: 'Could not get repo info' };
      try { return { ok: true, ...JSON.parse(out) }; } catch (_) { return { ok: true, raw: out }; }
    }
    case 'create_issue': {
      if (!repo || !title) return { error: 'repo and title are required' };
      const out = gh(`issue create --repo ${repo} --title "${title}" --body "${body || ''}" --json number,url,title`);
      if (!out) return { error: 'Failed to create issue' };
      try { return { ok: true, ...JSON.parse(out) }; } catch (_) { return { ok: true, raw: out }; }
    }
    case 'list_issues': {
      if (!repo) return { error: 'repo is required' };
      const out = gh(`issue list --repo ${repo} --limit 20 --json number,title,state,url,createdAt`);
      if (!out) return { error: 'Failed to list issues' };
      try { return { ok: true, issues: JSON.parse(out) }; } catch (_) { return { ok: true, raw: out }; }
    }
    case 'create_pr': {
      if (!repo || !title) return { error: 'repo and title are required' };
      const b = branch || 'HEAD';
      const baseBranch = base || 'main';
      const out = gh(`pr create --repo ${repo} --title "${title}" --body "${body || ''}" --head ${b} --base ${baseBranch} --json number,url,title`);
      if (!out) return { error: 'Failed to create PR' };
      try { return { ok: true, ...JSON.parse(out) }; } catch (_) { return { ok: true, raw: out }; }
    }
    case 'search_code': {
      if (!query) return { error: 'query is required' };
      const out = gh(`search code "${query}" --limit 10 --json repository,path,textMatches`);
      if (!out) {
        const apiResult = ghApi(`/search/code?q=${encodeURIComponent(query)}&per_page=10`);
        if (apiResult?.items) return { ok: true, results: apiResult.items.map(i => ({ repo: i.repository?.full_name, path: i.path, url: i.html_url })) };
        return { error: 'Search failed' };
      }
      try { return { ok: true, results: JSON.parse(out) }; } catch (_) { return { ok: true, raw: out }; }
    }
    default:
      return { error: `Unknown action: ${action}. Available: list_repos, create_issue, list_issues, create_pr, search_code, repo_info` };
  }
}
