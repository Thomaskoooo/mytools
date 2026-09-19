import { jsonResponse } from '../_utils.js';
import { verifySession, isAdminRequest } from '../_auth.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!isAdminRequest(request)) return jsonResponse({ error: 'Bad request.' }, 400);

  const authed = await verifySession(env, request);
  if (!authed) return jsonResponse({ error: 'Not authenticated.' }, 401);
  if (!env.UPLOADS_BUCKET) return jsonResponse({ error: 'File storage is not configured.' }, 500);

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: 'Invalid request.' }, 400);
  }

  const id = typeof body.id === 'string' ? body.id : '';
  if (!/^[a-f0-9]{32}$/.test(id)) return jsonResponse({ error: 'Invalid file id.' }, 400);

  await env.UPLOADS_BUCKET.delete(id);
  return jsonResponse({ ok: true });
}
