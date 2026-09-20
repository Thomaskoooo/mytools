/**
 * Shared helpers for the public /s/:id share routes (preview page + raw file).
 */

export async function getLiveHead(context, id) {
  const { env } = context;
  if (!/^[a-f0-9]{32}$/.test(id)) return { head: null };
  if (!env.UPLOADS_BUCKET) return { head: null, notConfigured: true };

  const head = await env.UPLOADS_BUCKET.head(id);
  if (!head) return { head: null };

  const meta = head.customMetadata || {};
  const expiresAtMs = meta.expiresAt ? Date.parse(meta.expiresAt) : null;
  if (expiresAtMs && expiresAtMs < Date.now()) {
    context.waitUntil(env.UPLOADS_BUCKET.delete(id));
    return { head: null, expired: true };
  }

  return { head, meta };
}

export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

export function humanSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

export function notFoundPage() {
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
