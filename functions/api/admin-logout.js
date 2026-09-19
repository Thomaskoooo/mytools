import { jsonResponse } from '../_utils.js';
import { isAdminRequest } from '../_auth.js';

export async function onRequestPost(context) {
  if (!isAdminRequest(context.request)) return jsonResponse({ error: 'Bad request.' }, 400);
  const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  headers.append('Set-Cookie', 'admin_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0');
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}
