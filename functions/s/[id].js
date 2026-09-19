/**
 * GET /s/:id — public download/preview link for a temporarily shared file.
 * No authentication: the 32-hex-char id itself is the unguessable capability.
 * Expired objects are lazily deleted the first time someone hits their link.
 */

function notFoundPage() {
  return new Response(
    '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<meta name="robots" content="noindex">' +
    '<title>Link expired — MyTools</title></head>' +
    '<body style="font-family:-apple-system,sans-serif;text-align:center;padding:100px 20px;background:#0a0a0c;color:#f2f2f5">' +
    '<h1 style="margin-bottom:8px">Link expired or not found</h1>' +
    '<p style="color:#a3a3ad">This file is no longer available.</p>' +
    '<p><a href="/" style="color:#6366f1">Go to MyTools</a></p>' +
    '</body></html>',
    { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex' } }
  );
}

export async function onRequestGet(context) {
  const { params, env } = context;
  const id = params.id;

  if (!/^[a-f0-9]{32}$/.test(id)) {
    return notFoundPage();
  }
  if (!env.UPLOADS_BUCKET) {
    return new Response('File storage is not configured.', { status: 500 });
  }

  const object = await env.UPLOADS_BUCKET.get(id);
  if (!object) {
    return notFoundPage();
  }

  const meta = object.customMetadata || {};
  const expiresAtMs = meta.expiresAt ? Date.parse(meta.expiresAt) : null;
  if (expiresAtMs && expiresAtMs < Date.now()) {
    context.waitUntil(env.UPLOADS_BUCKET.delete(id));
    return notFoundPage();
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Content-Length', String(object.size));
  headers.set('Cache-Control', 'private, no-store');
  headers.set('X-Robots-Tag', 'noindex');
  headers.set('X-Content-Type-Options', 'nosniff');
  const safeName = (meta.originalName || id).replace(/["\r\n]/g, '');
  headers.set('Content-Disposition', 'inline; filename="' + safeName + '"');

  return new Response(object.body, { status: 200, headers: headers });
}
