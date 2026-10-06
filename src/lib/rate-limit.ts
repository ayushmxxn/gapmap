// Sliding-window rate limiter that works across Node.js and Cloudflare Workers (vinext).


interface RateLimitRecord {
  currentCount: number;
  previousCount: number;
  windowStart: number;
  lastSeen: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();
const MAX_STORE_SIZE = 5000;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour window
const MAX_HITS = 20; // 20 scans per hour per IP

function pruneStore(now: number): void {
  const cutoff = now - 2 * WINDOW_MS;
  for (const [ip, record] of rateLimitStore.entries()) {
    if (record.lastSeen < cutoff) {
      rateLimitStore.delete(ip);
    }
  }
}

export interface RateLimitResult {
  limited: boolean;
  remaining: number;
  resetSeconds: number;
}

export function checkRateLimit(ip: string): RateLimitResult {
  // Bypass in development so local work and tests aren't blocked.
  if (process.env.NODE_ENV !== "production") {
    return { limited: false, remaining: MAX_HITS, resetSeconds: 0 };
  }

  const now = Date.now();

  let record = rateLimitStore.get(ip);
  if (!record) {
    if (rateLimitStore.size >= MAX_STORE_SIZE) {
      pruneStore(now);
      if (rateLimitStore.size >= MAX_STORE_SIZE) {
        const oldestIp = rateLimitStore.keys().next().value;
        if (oldestIp) rateLimitStore.delete(oldestIp);
      }
    }
    record = {
      currentCount: 0,
      previousCount: 0,
      windowStart: now,
      lastSeen: now,
    };
    rateLimitStore.set(ip, record);
  }

  const elapsed = now - record.windowStart;
  if (elapsed >= 2 * WINDOW_MS) {
    record.previousCount = 0;
    record.currentCount = 0;
    record.windowStart = now;
  } else if (elapsed >= WINDOW_MS) {
    record.previousCount = record.currentCount;
    record.currentCount = 0;
    record.windowStart += WINDOW_MS;
  }

  const windowProgress = Math.min(
    1,
    Math.max(0, (now - record.windowStart) / WINDOW_MS),
  );
  const estimatedCount =
    Math.floor(record.previousCount * (1 - windowProgress)) +
    record.currentCount;

  record.lastSeen = now;

  if (estimatedCount >= MAX_HITS) {
    const resetSeconds = Math.ceil(
      (record.windowStart + WINDOW_MS - now) / 1000,
    );
    return {
      limited: true,
      remaining: 0,
      resetSeconds: Math.max(1, resetSeconds),
    };
  }

  record.currentCount += 1;
  const remaining = Math.max(0, MAX_HITS - (estimatedCount + 1));
  const resetSeconds = Math.ceil(
    (record.windowStart + WINDOW_MS - now) / 1000,
  );
  return {
    limited: false,
    remaining,
    resetSeconds: Math.max(1, resetSeconds),
  };
}

export function isValidIp(ip: string): boolean {
  if (!ip || ip.length > 45) return false;
  const trimmed = ip.trim();

  // Handle bracketed IPv6 with optional port: [::1]:8080
  const bracketedIpv6 = trimmed.match(/^\[([0-9a-fA-F:]+)\](?::\d+)?$/);
  if (bracketedIpv6) {
    const raw = bracketedIpv6[1];
    return raw.includes(":") && /^[0-9a-fA-F:]{2,39}$/.test(raw);
  }

  // Handle IPv4 with optional port: 1.2.3.4:8080
  if (trimmed.includes(".")) {
    const cleanIpv4 = trimmed.replace(/:\d+$/, "");
    const ipv4 = /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
    return ipv4.test(cleanIpv4);
  }

  // Handle plain IPv6: ::1, 2001:db8::1
  const ipv6 = /^[0-9a-fA-F:]{2,39}$/;
  return trimmed.includes(":") && ipv6.test(trimmed);
}

// Select trusted platform edge headers first, or fallback to the rightmost proxy IP.
export function extractClientIp(req: Request): string {
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp && isValidIp(cfConnectingIp.trim())) {
    return cfConnectingIp.trim();
  }

  const vercelIp = req.headers.get("x-vercel-forwarded-for");
  if (vercelIp && isValidIp(vercelIp.trim())) {
    return vercelIp.trim();
  }

  // Proxies append to X-Forwarded-For, so the rightmost IP is the least spoofable.
  const xForwardedFor = req.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const parts = xForwardedFor
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    for (let i = parts.length - 1; i >= 0; i--) {
      if (isValidIp(parts[i])) {
        return parts[i];
      }
    }
  }

  const xRealIp = req.headers.get("x-real-ip");
  if (xRealIp && isValidIp(xRealIp.trim())) {
    return xRealIp.trim();
  }

  return "127.0.0.1";
}
