/**
 * GET /s/:id/raw — streams the actual file bytes, with HTTP Range support
 * (needed for video seeking / fast-start playback). Used as the src for
 * <video>/<img>/<audio> on the preview page, and as the Download button
 * target (?dl=1 forces an attachment disposition instead of inline).
 */
import { getLiveHead, notFoundPage } from '../_lookup.js';

function parseRange(rangeHeader, totalSize) {
  const m = /^bytes=(\d*)-(\d*)$/.exec((rangeHeader || '').trim());
  if (!m) return null;
  const startStr = m[1];
  const endStr = m[2];
  if (startStr === '' && endStr === '') return null;

  let start, end;
  if (startStr === '') {
    const suffixLength = parseInt(endStr, 10);
    if (isNaN(suffixLength) || suffixLength <= 0) return null;
    start = Math.max(0, totalSize - suffixLength);
    end = totalSize - 1;
  } else {
    start = parseInt(startStr, 10);
    end = endStr === '' ? totalSize - 1 : parseInt(endStr, 10);
  }
  if (isNaN(start) || isNaN(end) || start > end || start < 0 || end >= totalSize) return null;
  return { start: start, end: end };
}

export async function onRequestGet(context) {
  const id = context.params.id;
  const { head, meta, notConfigured } = await getLiveHead(context, id);

  if (notConfigured) return new Response('File storage is not configured.', { status: 500 });
  if (!head) return notFoundPage();

  const totalSize = head.size;
  const rangeHeader = context.request.headers.get('Range');
  const range = rangeHeader ? parseRange(rangeHeader, totalSize) : null;
  const forceDownload = new URL(context.request.url).searchParams.get('dl') === '1';
  const safeName = (meta.originalName || id).replace(/["\r\n]/g, '');

  const headers = new Headers();
  head.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'private, no-store');
  headers.set('X-Robots-Tag', 'noindex');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Content-Disposition', (forceDownload ? 'attachment' : 'inline') + '; filename="' + safeName + '"');

  if (rangeHeader && !range) {
    headers.set('Content-Range', 'bytes */' + totalSize);
    return new Response(null, { status: 416, headers: headers });
  }

  if (range) {
    const object = await context.env.UPLOADS_BUCKET.get(id, { range: { offset: range.start, length: range.end - range.start + 1 } });
    if (!object) return notFoundPage();
    headers.set('Content-Length', String(range.end - range.start + 1));
    headers.set('Content-Range', 'bytes ' + range.start + '-' + range.end + '/' + totalSize);
    return new Response(object.body, { status: 206, headers: headers });
  }

  const object = await context.env.UPLOADS_BUCKET.get(id);
  if (!object) return notFoundPage();
  headers.set('Content-Length', String(totalSize));
  return new Response(object.body, { status: 200, headers: headers });
}
