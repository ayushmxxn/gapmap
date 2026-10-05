/**
 * Production-grade in-memory sliding-window rate limiter.
 * Safe for Cloudflare Workers (vinext) and Node.js runtimes.
 * Includes periodic pruning to prevent memory leaks.
 */

interface RateLimitRecord {
  hits: number[];
  lastSeen: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();
const MAX_STORE_SIZE = 5000;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour window
const MAX_HITS = 20; // 20 scans per hour per IP

function pruneStore(now: number): void {
  const windowStart = now - WINDOW_MS;
  for (const [ip, record] of rateLimitStore.entries()) {
    if (record.lastSeen < windowStart) {
      rateLimitStore.delete(ip);
    }
  }
}

export interface RateLimitResult {
  limited: boolean;
  remaining: number;
  resetSeconds: number;
}

/**
 * Checks and records an access attempt for the given IP address.
 */
export function checkRateLimit(ip: string): RateLimitResult {
  // Never rate-limit local development
  if (process.env.NODE_ENV !== "production") {
    return { limited: false, remaining: MAX_HITS, resetSeconds: 0 };
  }

  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  // Prune periodically when map exceeds threshold
  if (rateLimitStore.size > MAX_STORE_SIZE) {
    pruneStore(now);
  }

  let record = rateLimitStore.get(ip);
  if (!record) {
    record = { hits: [], lastSeen: now };
    rateLimitStore.set(ip, record);
  }

  record.lastSeen = now;
  record.hits = record.hits.filter((timestamp) => timestamp > windowStart);

  if (record.hits.length >= MAX_HITS) {
    const oldestHit = record.hits[0] ?? now;
    const resetMs = Math.max(0, oldestHit + WINDOW_MS - now);
    return {
      limited: true,
      remaining: 0,
      resetSeconds: Math.ceil(resetMs / 1000),
    };
  }

  record.hits.push(now);
  const remaining = Math.max(0, MAX_HITS - record.hits.length);
  return {
    limited: false,
    remaining,
    resetSeconds: Math.ceil(WINDOW_MS / 1000),
  };
}

/**
 * Robustly extracts the client IP address from proxy headers.
 */
export function extractClientIp(req: Request): string {
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp && cfConnectingIp.trim().length > 0) {
    return cfConnectingIp.trim();
  }

  const xRealIp = req.headers.get("x-real-ip");
  if (xRealIp && xRealIp.trim().length > 0) {
    return xRealIp.trim();
  }

  const xForwardedFor = req.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(",")[0]?.trim();
    if (firstIp && firstIp.length > 0) {
      return firstIp;
    }
  }

  return "127.0.0.1";
}
