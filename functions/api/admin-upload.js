import { jsonResponse, rateLimit } from '../_utils.js';
import { verifySession, isAdminRequest } from '../_auth.js';

const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB
const DEFAULT_TTL_SECONDS = 60 * 60 * 24; // 24h

function randomId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!isAdminRequest(request)) return jsonResponse({ error: 'Bad request.' }, 400);

  const authed = await verifySession(env, request);
  if (!authed) return jsonResponse({ error: 'Not authenticated.' }, 401);

  if (!env.UPLOADS_BUCKET) {
    return jsonResponse({ error: 'File storage is not configured. Bind an R2 bucket named UPLOADS_BUCKET to this project.' }, 500);
  }

  const rl = await rateLimit(context, 'admin-upload', 20, 3600);
  if (!rl.allowed) return jsonResponse({ error: 'Too many uploads. Please wait and try again.' }, 429);

  const contentLength = parseInt(request.headers.get('Content-Length') || '0', 10);
  if (!contentLength) return jsonResponse({ error: 'Missing or empty file body.' }, 400);
  if (contentLength > MAX_SIZE_BYTES) return jsonResponse({ error: 'File is too large. Maximum size is 100 MB.' }, 413);

  let fileName = 'file';
  const rawName = request.headers.get('X-File-Name');
  if (rawName) {
    try { fileName = decodeURIComponent(rawName); } catch (e) { fileName = rawName; }
  }
  fileName = fileName.replace(/[\r\n"]/g, '').slice(0, 200) || 'file';

  const contentType = request.headers.get('Content-Type') || 'application/octet-stream';
  const id = randomId();
  const now = Date.now();
  const expiresAt = now + DEFAULT_TTL_SECONDS * 1000;

  await env.UPLOADS_BUCKET.put(id, request.body, {
    httpMetadata: { contentType: contentType },
    customMetadata: {
      originalName: fileName,
      uploadedAt: new Date(now).toISOString(),
      expiresAt: new Date(expiresAt).toISOString(),
      size: String(contentLength)
    }
  });

  const url = new URL(request.url);
  const shareUrl = url.origin + '/s/' + id;

  return jsonResponse({
    ok: true,
    id: id,
    url: shareUrl,
    name: fileName,
    size: contentLength,
    expiresAt: new Date(expiresAt).toISOString()
  });
}

export async function onRequestGet() {
  return jsonResponse({ error: 'Method not allowed.' }, 405);
}
