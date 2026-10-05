import type { ScanResult } from "@/lib/scoring";
import type { PlaceReviews, TrendsTimelinePoint } from "@/lib/serpapi";

/**
 * Production-grade in-memory multi-tier cache and in-flight request coalescer.
 *
 * Prevents:
 * 1. Duplicate expensive SerpApi calls when client network retries or double-clicks occur.
 * 2. Redundant Google Trends requests (Google Trends data is national and identical across neighborhoods).
 * 3. Redundant Google Maps Reviews requests for high-volume anchor places queried across adjacent scans.
 * 4. Memory bloat via strict entry count ceilings and LRU (least-recently-used) eviction.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/* =========================================================================
   1. Full Scan Result Cache (5 min TTL)
   ========================================================================= */

const SCAN_CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_SCAN_ENTRIES = 200;

const scanCache = new Map<string, CacheEntry<ScanResult>>();
const inFlightScans = new Map<string, Promise<ScanResult>>();

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
  return entry.data;
}

export function setCachedScan(key: string, result: ScanResult): void {
  const now = Date.now();
  if (scanCache.size >= MAX_SCAN_ENTRIES) {
    // Evict oldest entry in O(1)
    const oldestKey = scanCache.keys().next().value;
    if (oldestKey) scanCache.delete(oldestKey);
  }
  scanCache.set(key, {
    data: result,
    expiresAt: now + SCAN_CACHE_TTL_MS,
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

/* =========================================================================
   2. Google Trends Cache (60 min TTL)
   National search volume for a query (e.g. "gym" in "IN") does not change
   from neighborhood to neighborhood and updates daily at most.
   ========================================================================= */

const TRENDS_CACHE_TTL_MS = 60 * 60 * 1000; // 60 minutes
const MAX_TRENDS_ENTRIES = 100;

const trendsCache = new Map<string, CacheEntry<TrendsTimelinePoint[]>>();
const inFlightTrends = new Map<string, Promise<TrendsTimelinePoint[]>>();

export function getTrendsCacheKey(input: {
  q: string;
  geo: string;
  date: string;
}): string {
  return `${input.geo}:${input.date}:${input.q.toLowerCase().trim()}`;
}

export function getCachedTrends(key: string): TrendsTimelinePoint[] | null {
  const now = Date.now();
  const entry = trendsCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= now) {
    trendsCache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCachedTrends(
  key: string,
  data: TrendsTimelinePoint[],
): void {
  const now = Date.now();
  if (trendsCache.size >= MAX_TRENDS_ENTRIES) {
    const oldestKey = trendsCache.keys().next().value;
    if (oldestKey) trendsCache.delete(oldestKey);
  }
  trendsCache.set(key, {
    data,
    expiresAt: now + TRENDS_CACHE_TTL_MS,
  });
}

export function getInFlightTrends(
  key: string,
): Promise<TrendsTimelinePoint[]> | null {
  return inFlightTrends.get(key) ?? null;
}

export function setInFlightTrends(
  key: string,
  promise: Promise<TrendsTimelinePoint[]>,
): void {
  inFlightTrends.set(key, promise);
}

export function clearInFlightTrends(key: string): void {
  inFlightTrends.delete(key);
}

/* =========================================================================
   3. Place Reviews Cache (30 min TTL)
   Customer reviews & topics for specific establishments (by data_id)
   ========================================================================= */

const REVIEWS_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_REVIEWS_ENTRIES = 300;

const reviewsCache = new Map<string, CacheEntry<PlaceReviews>>();
const inFlightReviews = new Map<string, Promise<PlaceReviews>>();

export function getCachedPlaceReviews(dataId: string): PlaceReviews | null {
  const now = Date.now();
  const entry = reviewsCache.get(dataId);
  if (!entry) return null;
  if (entry.expiresAt <= now) {
    reviewsCache.delete(dataId);
    return null;
  }
  return entry.data;
}

export function setCachedPlaceReviews(
  dataId: string,
  data: PlaceReviews,
): void {
  const now = Date.now();
  if (reviewsCache.size >= MAX_REVIEWS_ENTRIES) {
    const oldestKey = reviewsCache.keys().next().value;
    if (oldestKey) reviewsCache.delete(oldestKey);
  }
  reviewsCache.set(dataId, {
    data,
    expiresAt: now + REVIEWS_CACHE_TTL_MS,
  });
}

export function getInFlightPlaceReviews(
  dataId: string,
): Promise<PlaceReviews> | null {
  return inFlightReviews.get(dataId) ?? null;
}

export function setInFlightPlaceReviews(
  dataId: string,
  promise: Promise<PlaceReviews>,
): void {
  inFlightReviews.set(dataId, promise);
}

export function clearInFlightPlaceReviews(dataId: string): void {
  inFlightReviews.delete(dataId);
}
