/**
 * GET /api/http-headers?url=https://example.com
 *
 * Fetches HTTP status + response headers for a user-supplied URL, server-side,
 * with SSRF protections: only http/https, no local/private/reserved hostnames
 * or IP literals, resolved hostnames are checked against the same reserved
 * ranges before every hop (including redirects), and redirects are followed
 * manually so each hop is re-validated instead of trusting the runtime's
 * automatic redirect handling.
 *
 * Note on limits: because the Workers runtime resolves DNS itself at fetch time,
 * there is an inherent (small) DNS-rebinding TOCTOU window between our
 * pre-fetch resolution check and the actual connection — this is a platform
 * limitation shared by any edge-function-based URL fetcher, not something we
 * can fully close without raw socket access. Treat this endpoint as
 * defense-in-depth, not a hard guarantee, and keep it rate-limited.
 */
import { jsonResponse, rateLimit, withTimeout } from '../_utils.js';

const MAX_REDIRECTS = 5;
const REQUEST_TIMEOUT_MS = 6000;
const BLOCKED_HOSTNAMES = ['localhost', '0.0.0.0', 'metadata.google.internal', 'metadata.internal'];

function ipv4ToInt(ip) {
  var o = ip.split('.').map(Number);
  if (o.length !== 4 || o.some(function (n) { return isNaN(n) || n < 0 || n > 255; })) return null;
  return ((o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]) >>> 0;
}

function isPrivateOrReservedIPv4(ip) {
  var n = ipv4ToInt(ip);
  if (n === null) return true; // fail closed
  var ranges = [
    ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
    ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24],
    ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24],
    ['224.0.0.0', 4], ['240.0.0.0', 4], ['255.255.255.255', 32]
  ];
  return ranges.some(function (r) {
    var base = ipv4ToInt(r[0]);
    var bits = r[1];
    var mask = bits === 0 ? 0 : (0xFFFFFFFF << (32 - bits)) >>> 0;
    return (n & mask) === (base & mask);
  });
}

function ipv4ToHextets(ipv4) {
  var o = ipv4.split('.').map(Number);
  if (o.length !== 4 || o.some(function (n) { return isNaN(n) || n < 0 || n > 255; })) return null;
  return [
    (((o[0] << 8) | o[1]) >>> 0).toString(16).padStart(4, '0'),
    (((o[2] << 8) | o[3]) >>> 0).toString(16).padStart(4, '0')
  ];
}

function expandIPv6(rawAddr) {
  var addr = rawAddr.replace(/^\[|\]$/g, '').toLowerCase();
  var lastColon = addr.lastIndexOf(':');
  if (addr.indexOf('.') !== -1 && lastColon !== -1) {
    var hextets = ipv4ToHextets(addr.slice(lastColon + 1));
    if (!hextets) return null;
    addr = addr.slice(0, lastColon + 1) + hextets[0] + ':' + hextets[1];
  }
  var groups;
  if (addr.indexOf('::') !== -1) {
    var sides = addr.split('::');
    if (sides.length > 2) return null;
    var head = sides[0] ? sides[0].split(':').filter(Boolean) : [];
    var tail = sides[1] ? sides[1].split(':').filter(Boolean) : [];
    var missing = 8 - head.length - tail.length;
    if (missing < 0) return null;
    groups = head.concat(new Array(missing).fill('0'), tail);
  } else {
    groups = addr.split(':');
  }
  if (groups.length !== 8) return null;
  for (var i = 0; i < 8; i++) {
    if (!/^[0-9a-f]{1,4}$/.test(groups[i])) return null;
    groups[i] = groups[i].padStart(4, '0');
  }
  return groups;
}

function isPrivateOrReservedIPv6(addr) {
  var g = expandIPv6(addr);
  if (!g) return true; // fail closed
  var full = g.join(':');
  if (full === '0000:0000:0000:0000:0000:0000:0000:0000') return true;
  if (full === '0000:0000:0000:0000:0000:0000:0000:0001') return true;
  if (g[0] === '0000' && g[1] === '0000' && g[2] === '0000' && g[3] === '0000' && g[4] === '0000' && g[5] === 'ffff') {
    var ipv4 = parseInt(g[6].slice(0, 2), 16) + '.' + parseInt(g[6].slice(2, 4), 16) + '.' + parseInt(g[7].slice(0, 2), 16) + '.' + parseInt(g[7].slice(2, 4), 16);
    return isPrivateOrReservedIPv4(ipv4);
  }
  var first = parseInt(g[0], 16);
  if (first >= 0xfe80 && first <= 0xfebf) return true; // link-local fe80::/10
  if (first >= 0xfc00 && first <= 0xfdff) return true; // unique local fc00::/7
  if (first >= 0xff00 && first <= 0xffff) return true; // multicast ff00::/8
  if (g[0] === '2001' && g[1] === '0db8') return true; // documentation 2001:db8::/32
  return false;
}

function isIPv4Literal(host) { return /^\d{1,3}(\.\d{1,3}){3}$/.test(host); }
function isIPv6Literal(host) { return host.indexOf(':') !== -1; }

async function resolveHostIps(hostname) {
  var ips = [];
  for (var i = 0; i < 2; i++) {
    var type = i === 0 ? 'A' : 'AAAA';
    try {
      var resp = await withTimeout(function (signal) {
        return fetch('https://cloudflare-dns.com/dns-query?name=' + encodeURIComponent(hostname) + '&type=' + type, {
          headers: { Accept: 'application/dns-json' }, signal: signal
        });
      }, 4000);
      if (!resp.ok) continue;
      var data = await resp.json();
      (data.Answer || []).forEach(function (a) {
        if (a.type === 1 || a.type === 28) ips.push(a.data);
      });
    } catch (e) { /* ignore, treated as unresolved below */ }
  }
  return ips;
}

async function validateTarget(urlObj) {
  if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
    return { ok: false, reason: 'Only http:// and https:// URLs are allowed.' };
  }
  var hostname = urlObj.hostname.toLowerCase();
  if (!hostname) return { ok: false, reason: 'Invalid URL.' };
  if (BLOCKED_HOSTNAMES.indexOf(hostname) !== -1 || hostname.endsWith('.localhost')) {
    return { ok: false, reason: 'Requests to local or internal hosts are not allowed.' };
  }
  if (isIPv4Literal(hostname)) {
    return isPrivateOrReservedIPv4(hostname)
      ? { ok: false, reason: 'Requests to private or reserved IP ranges are not allowed.' }
      : { ok: true };
  }
  if (isIPv6Literal(hostname)) {
    return isPrivateOrReservedIPv6(hostname)
      ? { ok: false, reason: 'Requests to private or reserved IP ranges are not allowed.' }
      : { ok: true };
  }
  var ips = await resolveHostIps(hostname);
  if (ips.length === 0) return { ok: false, reason: 'Could not resolve this domain.' };
  for (var i = 0; i < ips.length; i++) {
    var blocked = ips[i].indexOf(':') !== -1 ? isPrivateOrReservedIPv6(ips[i]) : isPrivateOrReservedIPv4(ips[i]);
    if (blocked) return { ok: false, reason: 'This domain resolves to a private or internal address and cannot be requested.' };
  }
  return { ok: true };
}

async function fetchChain(startUrl, method) {
  var currentUrl = startUrl;
  var hops = [];
  for (var i = 0; i <= MAX_REDIRECTS; i++) {
    var urlObj;
    try { urlObj = new URL(currentUrl); } catch (e) { throw new Error('Invalid URL.'); }

    var check = await validateTarget(urlObj);
    if (!check.ok) throw new Error(check.reason);

    var response = await withTimeout(function (signal) {
      return fetch(currentUrl, {
        method: method,
        redirect: 'manual',
        signal: signal,
        headers: { 'User-Agent': 'MyTools-HTTPHeaders/1.0 (+https://mytools.pages.dev)', Accept: '*/*' }
      });
    }, REQUEST_TIMEOUT_MS);

    if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
      var location = new URL(response.headers.get('location'), currentUrl).toString();
      hops.push({ url: currentUrl, status: response.status, location: location });
      if (i === MAX_REDIRECTS) throw new Error('Too many redirects.');
      currentUrl = location;
      continue;
    }

    return { finalUrl: currentUrl, response: response, hops: hops };
  }
}

export async function onRequestGet(context) {
  var url = new URL(context.request.url);
  var target = (url.searchParams.get('url') || '').trim();

  if (!target || target.length > 2048) {
    return jsonResponse({ error: 'Enter a valid URL, e.g. https://example.com' }, 400);
  }
  if (!/^https?:\/\//i.test(target)) target = 'https://' + target;

  var rl = await rateLimit(context, 'http-headers', 15, 60);
  if (!rl.allowed) {
    return jsonResponse({ error: 'Too many requests. Please wait a minute and try again.' }, 429);
  }

  try {
    var result = await fetchChain(target, 'HEAD');
    if (result.response.status === 405) {
      result = await fetchChain(target, 'GET');
    }

    var headersObj = {};
    result.response.headers.forEach(function (value, key) { headersObj[key] = value; });

    return jsonResponse({
      requestedUrl: target,
      finalUrl: result.finalUrl,
      status: result.response.status,
      statusText: result.response.statusText,
      headers: headersObj,
      server: headersObj['server'] || null,
      contentType: headersObj['content-type'] || null,
      contentLength: headersObj['content-length'] || null,
      redirects: result.hops
    });
  } catch (e) {
    var message = (e && e.message) || 'Something went wrong. Please try again.';
    var isClientFacing = /not allowed|Invalid URL|Too many redirects|Could not resolve/.test(message);
    return jsonResponse({ error: isClientFacing ? message : 'Could not reach that URL. Please check it and try again.' }, 502);
  }
}

export async function onRequestPost() {
  return jsonResponse({ error: 'Method not allowed. Use GET.' }, 405);
}
