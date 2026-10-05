import type { ScanResult } from "@/lib/scoring";

/**
 * In-memory scan cache and in-flight request coalescer.
 *
 * Prevents:
 * 1. Duplicate expensive SerpApi calls when client network retries or double-clicks occur.
 * 2. Unnecessary upstream calls for recently evaluated exact coordinates/categories.
 */

interface CachedScanEntry {
  result: ScanResult;
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL
const MAX_CACHE_ENTRIES = 200;

const scanCache = new Map<string, CachedScanEntry>();
const inFlightScans = new Map<string, Promise<ScanResult>>();

function pruneCache(now: number): void {
  for (const [key, entry] of scanCache.entries()) {
    if (entry.expiresAt <= now) {
      scanCache.delete(key);
    }
  }
}

/**
 * Generates a deterministic cache key for a scan query.
 * Coordinates are rounded to 4 decimals (~11m) to absorb micro-jitter.
 */
export function getScanCacheKey(input: {
  lat: number;
  lng: number;
  categoryId: string;
  scope: string;
}): string {
  return `${input.scope}:${input.categoryId.toLowerCase().trim()}:${input.lat.toFixed(4)}:${input.lng.toFixed(4)}`;
}

export function getCachedScan(key: string): ScanResult | null {
  const now = Date.now();
  const entry = scanCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= now) {
    scanCache.delete(key);
    return null;
  }
  return entry.result;
}

export function setCachedScan(key: string, result: ScanResult): void {
  const now = Date.now();
  if (scanCache.size >= MAX_CACHE_ENTRIES) {
    pruneCache(now);
    if (scanCache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = scanCache.keys().next().value;
      if (oldestKey) scanCache.delete(oldestKey);
    }
  }
  scanCache.set(key, {
    result,
    expiresAt: now + CACHE_TTL_MS,
  });
}

export function getInFlightScan(key: string): Promise<ScanResult> | null {
  return inFlightScans.get(key) ?? null;
}

export function setInFlightScan(
  key: string,
  promise: Promise<ScanResult>,
): void {
  inFlightScans.set(key, promise);
}

export function clearInFlightScan(key: string): void {
  inFlightScans.delete(key);
}
