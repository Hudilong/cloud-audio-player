type Bucket = number[];

const store =
  (globalThis as unknown as { __rateLimitStore?: Map<string, Bucket> })
    .__rateLimitStore || new Map<string, Bucket>();

// Persist across hot reloads
(
  globalThis as unknown as { __rateLimitStore?: Map<string, Bucket> }
).__rateLimitStore = store;

export type RateLimitResult = {
  allowed: boolean;
  retryAfter: number;
  limit: number;
  remaining: number;
};

export const getClientIp = (request: Request) => {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',').map((part) => part.trim());
    if (parts[0]) return parts[0];
  }

  const maybeIp = (request as unknown as { ip?: string }).ip;
  return maybeIp || 'unknown';
};

export const applyRateLimit = (
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult => {
  const now = Date.now();
  const windowStart = now - windowMs;
  const timestamps = store.get(key) || [];
  const fresh = timestamps.filter((timestamp) => timestamp > windowStart);

  if (fresh.length >= limit) {
    const retryAfterMs = Math.max(fresh[0] + windowMs - now, 0);
    store.set(key, fresh);
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil(retryAfterMs / 1000)),
      limit,
      remaining: 0,
    };
  }

  fresh.push(now);
  store.set(key, fresh);
  return {
    allowed: true,
    retryAfter: 0,
    limit,
    remaining: Math.max(0, limit - fresh.length),
  };
};

export const rateLimitHeaders = (result: RateLimitResult) => ({
  'X-RateLimit-Limit': String(result.limit),
  'X-RateLimit-Remaining': String(result.remaining),
  ...(result.allowed
    ? {}
    : {
        'Retry-After': String(result.retryAfter),
      }),
});
