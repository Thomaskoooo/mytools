/**
 * Stateless admin session helper for the /admin file-sharing area.
 * No database: the session cookie is a signed { exp } payload, HMAC-keyed
 * off a hash of ADMIN_PASSWORD, so a valid cookie can only be forged by
 * someone who already knows the password.
 */

function bufferToHex(buf) {
  return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function getHmacKey(env) {
  var enc = new TextEncoder();
  var passHash = await crypto.subtle.digest('SHA-256', enc.encode(env.ADMIN_PASSWORD || ''));
  return crypto.subtle.importKey('raw', passHash, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function passwordMatches(env, submitted) {
  if (!env.ADMIN_PASSWORD) return false;
  var enc = new TextEncoder();
  var actualHash = await crypto.subtle.digest('SHA-256', enc.encode(env.ADMIN_PASSWORD));
  var submittedHash = await crypto.subtle.digest('SHA-256', enc.encode(submitted || ''));
  return constantTimeEqual(bufferToHex(actualHash), bufferToHex(submittedHash));
}

export async function createSessionCookie(env, ttlSeconds) {
  var exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  var payloadB64 = btoa(JSON.stringify({ exp: exp }));
  var key = await getHmacKey(env);
  var sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64));
  return payloadB64 + '.' + bufferToHex(sig);
}

function getCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  var parts = cookieHeader.split(';');
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i].trim();
    var idx = p.indexOf('=');
    if (idx === -1) continue;
    if (p.slice(0, idx) === name) return decodeURIComponent(p.slice(idx + 1));
  }
  return null;
}

export async function verifySession(env, request) {
  if (!env.ADMIN_PASSWORD) return false;
  var token = getCookie(request.headers.get('Cookie'), 'admin_session');
  if (!token) return false;
  var dotIndex = token.indexOf('.');
  if (dotIndex === -1) return false;
  var payloadB64 = token.slice(0, dotIndex);
  var sigHex = token.slice(dotIndex + 1);

  var key = await getHmacKey(env);
  var expectedSig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64));
  var expectedHex = bufferToHex(expectedSig);
  if (!constantTimeEqual(expectedHex, sigHex)) return false;

  try {
    var payload = JSON.parse(atob(payloadB64));
    return typeof payload.exp === 'number' && payload.exp > Math.floor(Date.now() / 1000);
  } catch (e) {
    return false;
  }
}

export function isAdminRequest(request) {
  return request.headers.get('X-Admin-Request') === '1';
}
