import { lookup } from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(lookup);

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_MAX_BYTES = 500 * 1024; // 500kb

function stripHtml(html) {
  let s = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return s.slice(0, 80000);
}

/** True if the given IP (v4 or v6) is private or link-local (SSRF risk). */
function isPrivateOrLinkLocalIP(address) {
  if (!address || typeof address !== 'string') return true;
  const ip = address.toLowerCase().trim();
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;
  if (ip.startsWith('10.')) return true;
  if (ip.startsWith('192.168.')) return true;
  if (ip.startsWith('172.')) {
    const second = parseInt(ip.split('.')[1], 10);
    if (second >= 16 && second <= 31) return true;
  }
  if (ip.startsWith('169.254.') || ip.startsWith('fe80:') || ip.startsWith('fc') || ip.startsWith('fd')) return true;
  return false;
}

function isBlockedUrl(url) {
  try {
    const u = new URL(url);
    if (u.protocol === 'file:') return true;
    if (['http:', 'https:'].indexOf(u.protocol) === -1) return true;
    const host = u.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1') return true;
    if (host.startsWith('192.168.') || host.startsWith('10.')) return true;
    if (host.startsWith('172.')) {
      const second = parseInt(host.split('.')[1], 10);
      if (second >= 16 && second <= 31) return true;
    }
    if (host.startsWith('169.254.') || host === '::1' || host.startsWith('fe80:')) return true;
    return false;
  } catch (_) {
    return true;
  }
}

export async function fetchUrl(url, ctx) {
  const timeout = ctx?.fetchTimeout ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = ctx?.maxFetchBytes ?? DEFAULT_MAX_BYTES;

  if (isBlockedUrl(url)) return { error: 'URL not allowed (file/localhost/private)', url };

  try {
    const u = new URL(url);
    const hostname = u.hostname;
    const { address } = await dnsLookup(hostname, { all: false });
    if (isPrivateOrLinkLocalIP(address)) {
      return { error: 'URL not allowed (resolved to private/link-local IP)', url };
    }
  } catch (e) {
    return { error: 'DNS lookup failed: ' + (e.message || String(e)), url };
  }

  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Ultimate/1.0 (local agent)' },
      redirect: 'follow',
    });
    clearTimeout(to);
    const finalUrl = res.url || url;
    if (finalUrl !== url) {
      try {
        const fu = new URL(finalUrl);
        const { address: finalAddr } = await dnsLookup(fu.hostname, { all: false });
        if (isPrivateOrLinkLocalIP(finalAddr)) {
          return { error: 'URL not allowed (redirect resolved to private/link-local IP)', url: finalUrl };
        }
      } catch (_) {}
    }
    if (!res.ok) return { error: `HTTP ${res.status}`, url: finalUrl };
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const reader = res.body?.getReader();
    if (!reader) {
      const text = await res.text();
      const safe = text.slice(0, maxBytes);
      if (contentType.includes('text/html')) return { content: stripHtml(safe) || '(no text)', url, truncated: text.length > maxBytes };
      return { content: safe, url, contentType: contentType.slice(0, 80) };
    }
    let raw = '';
    const decoder = new TextDecoder();
    while (raw.length < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      raw += decoder.decode(value, { stream: true });
    }
    reader.cancel?.();
    if (raw.length > maxBytes) raw = raw.slice(0, maxBytes);
    const text = contentType.includes('text/html') ? stripHtml(raw) : raw;
    return { content: text || '(no text extracted)', url, truncated: raw.length >= maxBytes };
  } catch (e) {
    clearTimeout(to);
    return { error: e.name === 'AbortError' ? 'Timeout' : (e.message || String(e)), url };
  }
}
