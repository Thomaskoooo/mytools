/**
 * GET /api/dns?domain=example.com
 * Looks up A, AAAA, MX, CNAME, NS and TXT records via Cloudflare's DNS-over-HTTPS
 * resolver. Runs server-side because browsers cannot make raw DNS queries.
 */
import { jsonResponse, rateLimit, withTimeout } from '../_utils.js';

const RECORD_TYPES = ['A', 'AAAA', 'MX', 'CNAME', 'NS', 'TXT'];
const TYPE_NUMBERS = { A: 1, NS: 2, CNAME: 5, MX: 15, TXT: 16, AAAA: 28 };

// RFC 1035-style hostname validation: labels of 1-63 alphanumerics/hyphens (no
// leading/trailing hyphen), joined by dots, max 253 chars overall.
const DOMAIN_RE = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))+$/;

function cleanTxt(value) {
  return typeof value === 'string' ? value.replace(/^"(.*)"$/, '$1') : value;
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const domain = (url.searchParams.get('domain') || '').trim().toLowerCase().replace(/\.$/, '');

  if (!domain || domain.length > 253 || !DOMAIN_RE.test(domain)) {
    return jsonResponse({ error: 'Enter a valid domain name, e.g. example.com' }, 400);
  }

  const rl = await rateLimit(context, 'dns', 20, 60);
  if (!rl.allowed) {
    return jsonResponse({ error: 'Too many requests. Please wait a minute and try again.' }, 429);
  }

  const records = {};

  await Promise.all(RECORD_TYPES.map(async function (type) {
    try {
      const response = await withTimeout(function (signal) {
        return fetch('https://cloudflare-dns.com/dns-query?name=' + encodeURIComponent(domain) + '&type=' + type, {
          headers: { Accept: 'application/dns-json' },
          signal: signal
        });
      }, 5000);

      if (!response.ok) { records[type] = []; return; }

      const data = await response.json();
      const wantedNumber = TYPE_NUMBERS[type];
      records[type] = (data.Answer || [])
        .filter(function (a) { return a.type === wantedNumber; })
        .map(function (a) { return type === 'TXT' ? cleanTxt(a.data) : a.data; });
    } catch (e) {
      records[type] = [];
    }
  }));

  return jsonResponse({ domain: domain, records: records });
}

export async function onRequestPost() {
  return jsonResponse({ error: 'Method not allowed. Use GET.' }, 405);
}
