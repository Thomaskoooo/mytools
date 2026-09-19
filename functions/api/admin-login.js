import { jsonResponse, rateLimit } from '../_utils.js';
import { passwordMatches, createSessionCookie, isAdminRequest } from '../_auth.js';

const SESSION_TTL_SECONDS = 60 * 60 * 24; // 24h, matches the file expiry window

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!isAdminRequest(request)) return jsonResponse({ error: 'Bad request.' }, 400);

  if (!env.ADMIN_PASSWORD) {
    return jsonResponse({ error: 'Admin access is not configured on this deployment.' }, 500);
  }

  const rl = await rateLimit(context, 'admin-login', 5, 900);
  if (!rl.allowed) {
    return jsonResponse({ error: 'Too many attempts. Please wait 15 minutes and try again.' }, 429);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: 'Invalid request.' }, 400);
  }

  const password = typeof body.password === 'string' ? body.password : '';
  const ok = await passwordMatches(env, password);
  if (!ok) {
    return jsonResponse({ error: 'Incorrect password.' }, 401);
  }

  const cookieValue = await createSessionCookie(env, SESSION_TTL_SECONDS);
  const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  headers.append('Set-Cookie', 'admin_session=' + cookieValue + '; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=' + SESSION_TTL_SECONDS);
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}

export async function onRequestGet() {
  return jsonResponse({ error: 'Method not allowed.' }, 405);
}
