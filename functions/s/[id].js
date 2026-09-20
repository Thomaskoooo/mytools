/**
 * GET /s/:id — public preview landing page for a shared file: shows an
 * inline player/viewer for images, video, audio and PDFs, plus a Download
 * button that always works regardless of file type. The actual bytes are
 * served separately at /s/:id/raw so this page stays lightweight HTML.
 */
import { getLiveHead, notFoundPage, escapeHtml, humanSize } from './_lookup.js';

function relativeExpiry(iso) {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'expired';
  const hours = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (hours >= 24) return Math.floor(hours / 24) + 'd ' + (hours % 24) + 'h';
  return hours + 'h ' + mins + 'm';
}

function previewMarkup(contentType, rawUrl) {
  if (contentType.indexOf('video/') === 0) {
    return '<video controls preload="metadata" playsinline style="width:100%;border-radius:8px;background:#000;max-height:70vh;display:block" src="' + rawUrl + '"></video>';
  }
  if (contentType.indexOf('image/') === 0) {
    return '<img src="' + rawUrl + '" alt="" style="width:100%;border-radius:8px;display:block">';
  }
  if (contentType.indexOf('audio/') === 0) {
    return '<audio controls style="width:100%" src="' + rawUrl + '"></audio>';
  }
  if (contentType === 'application/pdf') {
    return '<iframe src="' + rawUrl + '" style="width:100%;height:70vh;border:none;border-radius:8px;background:#fff"></iframe>';
  }
  return '<p class="field-hint" style="margin:0">No preview available for this file type.</p>';
}

export async function onRequestGet(context) {
  const id = context.params.id;
  const { head, meta, notConfigured } = await getLiveHead(context, id);

  if (notConfigured) return new Response('File storage is not configured.', { status: 500 });
  if (!head) return notFoundPage();

  const name = meta.originalName || id;
  const contentType = (head.httpMetadata && head.httpMetadata.contentType) || 'application/octet-stream';
  const rawUrl = '/s/' + id + '/raw';
  const downloadUrl = rawUrl + '?dl=1';
  const expiryText = relativeExpiry(meta.expiresAt);

  const html = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<meta name="robots" content="noindex, nofollow">' +
    '<title>' + escapeHtml(name) + ' — MyTools</title>' +
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml">' +
    '<script>(function(){try{var t=localStorage.getItem(\'mt-theme\');if(t===\'light\'||t===\'dark\'){document.documentElement.setAttribute(\'data-theme\',t);}}catch(e){}})();</script>' +
    '<link rel="stylesheet" href="/assets/css/style.css">' +
    '</head><body>' +
    '<main style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px">' +
    '<div class="card" style="max-width:640px;width:100%">' +
    '<h1 style="font-size:1.15rem;margin:0 0 4px;word-break:break-word">' + escapeHtml(name) + '</h1>' +
    '<p class="field-hint" style="margin:0 0 16px">' + humanSize(head.size) + (expiryText ? ' · expires in ' + escapeHtml(expiryText) : '') + '</p>' +
    previewMarkup(contentType, rawUrl) +
    '<div class="btn-row" style="margin-top:16px">' +
    '<a class="btn btn-primary" href="' + downloadUrl + '" download="' + escapeHtml(name) + '">Download</a>' +
    '</div></div></main></body></html>';

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow'
    }
  });
}
