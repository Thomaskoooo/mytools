import { jsonResponse } from '../_utils.js';
import { verifySession } from '../_auth.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const authed = await verifySession(env, request);
  if (!authed) return jsonResponse({ error: 'Not authenticated.' }, 401);
  if (!env.UPLOADS_BUCKET) return jsonResponse({ error: 'File storage is not configured. Bind an R2 bucket named UPLOADS_BUCKET to this project.' }, 500);

  const listing = await env.UPLOADS_BUCKET.list({ include: ['customMetadata'] });
  const now = Date.now();
  const url = new URL(request.url);

  const expiredKeys = [];
  const files = [];

  for (const obj of listing.objects) {
    const meta = obj.customMetadata || {};
    const expiresAtMs = meta.expiresAt ? Date.parse(meta.expiresAt) : null;
    if (expiresAtMs && expiresAtMs < now) {
      expiredKeys.push(obj.key);
      continue;
    }
    files.push({
      id: obj.key,
      name: meta.originalName || obj.key,
      size: obj.size,
      uploadedAt: meta.uploadedAt || obj.uploaded,
      expiresAt: meta.expiresAt || null,
      url: url.origin + '/s/' + obj.key
    });
  }

  if (expiredKeys.length) {
    context.waitUntil(Promise.all(expiredKeys.map(function (k) { return env.UPLOADS_BUCKET.delete(k); })));
  }

  files.sort(function (a, b) { return new Date(b.uploadedAt) - new Date(a.uploadedAt); });
  return jsonResponse({ files: files });
}
