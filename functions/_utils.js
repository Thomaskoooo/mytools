/**
 * Shared helpers for Cloudflare Pages Functions (server-side API endpoints).
 * Keep this framework-free — Pages Functions run on the Workers runtime, no Node APIs.
 */

export function jsonResponse(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer'
    }
  });
}

export function clientIp(request) {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || 'unknown';
}

/**
 * Fixed-window rate limiter backed by an optional KV namespace bound as RATE_LIMIT_KV.
 * If no KV namespace is bound, this fails open (allowed: true) so the site keeps working
 * out of the box — see README "Rate limiting" for how to bind the KV namespace, and prefer
 * Cloudflare's dashboard Rate Limiting Rules as the primary line of defense regardless.
 */
export async function rateLimit(context, bucket, limit, windowSeconds) {
  const kv = context.env && context.env.RATE_LIMIT_KV;
  if (!kv) return { allowed: true, enforced: false };

  const ip = clientIp(context.request);
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % windowSeconds);
  const key = 'rl:' + bucket + ':' + ip + ':' + windowStart;

  const currentRaw = await kv.get(key);
  const current = currentRaw ? parseInt(currentRaw, 10) : 0;

  if (current >= limit) {
    return { allowed: false, enforced: true };
  }

  await kv.put(key, String(current + 1), { expirationTtl: windowSeconds + 10 });
  return { allowed: true, enforced: true };
}

export async function withTimeout(promiseFactory, ms) {
  const controller = new AbortController();
  const timer = setTimeout(function () { controller.abort(); }, ms);
  try {
    return await promiseFactory(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}
