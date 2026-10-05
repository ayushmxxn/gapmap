import { z } from "zod";
import { getJson } from "serpapi";
import { serverEnv } from "@/lib/env";
import {
  clearInFlightPlaceReviews,
  clearInFlightTrends,
  getCachedPlaceReviews,
  getCachedTrends,
  getInFlightPlaceReviews,
  getInFlightTrends,
  getTrendsCacheKey,
  setCachedPlaceReviews,
  setCachedTrends,
  setInFlightPlaceReviews,
  setInFlightTrends,
} from "@/lib/scan-cache";

/**
 * Server-side SerpApi client. Never import from client components.
 *
 * Hardened with:
 * - Strict schema validation with safe fallbacks.
 * - Non-leaking error sanitization (API keys never appear in errors or logs).
 * - Per-request socket and promise timeouts.
 * - Explicit handling of empty result states (SerpApi "hasn't returned any results").
 * - Specialized error classifications (timeout, rate-limit, auth, network).
 */

const DEFAULT_TIMEOUT_MS = 12000; // 12 seconds per external request

export class SerpApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly userMessage: string;

  constructor(
    userMessage: string,
    options?: {
      statusCode?: number;
      code?: string;
      cause?: unknown;
    },
  ) {
    super(userMessage);
    this.name = "SerpApiError";
    this.userMessage = userMessage;
    this.statusCode = options?.statusCode ?? 502;
    this.code = options?.code ?? "UPSTREAM_ERROR";
    if (options?.cause) {
      this.cause = options.cause;
    }
  }
}

export class SerpApiTimeoutError extends SerpApiError {
  public readonly operation?: string;

  constructor(operation?: string) {
    super("External data provider timed out. Please try again.", {
      statusCode: 504,
      code: "UPSTREAM_TIMEOUT",
    });
    this.name = "SerpApiTimeoutError";
    this.operation = operation;
  }
}

export class SerpApiRateLimitError extends SerpApiError {
  constructor() {
    super("External search provider rate limit reached. Please wait a moment.", {
      statusCode: 429,
      code: "UPSTREAM_RATE_LIMITED",
    });
    this.name = "SerpApiRateLimitError";
  }
}

export class SerpApiAuthError extends SerpApiError {
  constructor() {
    super("Data provider configuration error.", {
      statusCode: 500,
      code: "PROVIDER_AUTH_ERROR",
    });
    this.name = "SerpApiAuthError";
  }
}

/**
 * Strips raw API keys and query-param secrets from text before any logging.
 */
export function sanitizeSecrets(text: string): string {
  const key = serverEnv.SERPAPI_KEY;
  let sanitized = text;
  if (key && key.length > 4) {
    sanitized = sanitized.replaceAll(key, "[REDACTED_API_KEY]");
  }
  return sanitized.replace(/api_key=([^&"'\s]+)/gi, "api_key=[REDACTED]");
}

export function logSafeError(context: string, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  console.error(
    `[SerpApi ERROR] ${context}: ${sanitizeSecrets(message)}`,
    stack ? `\n${sanitizeSecrets(stack)}` : "",
  );
}

function requireKey(): string {
  const key = serverEnv.SERPAPI_KEY;
  if (!key || key.trim().length === 0) {
    throw new SerpApiAuthError();
  }
  return key.trim();
}

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  operation: string,
): Promise<T> {
  let timer: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new SerpApiTimeoutError(operation));
    }, ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

const gpsSchema = z.object({
  latitude: z.number().finite(),
  longitude: z.number().finite(),
});

export const mapsPlaceSchema = z.object({
  position: z.number().optional(),
  title: z.string().default("Unknown Place"),
  place_id: z.string().optional(),
  data_id: z.string().optional(),
  data_cid: z.string().optional(),
  gps_coordinates: gpsSchema.optional(),
  rating: z.number().optional(),
  reviews: z.number().optional(),
  price: z.string().optional(),
  type: z.string().optional(),
  types: z.array(z.string()).optional(),
  address: z.string().optional(),
  hours: z.string().optional(),
  open_state: z.string().optional(),
  phone: z.string().optional(),
});

export type MapsPlace = z.infer<typeof mapsPlaceSchema>;

const mapsResponseSchema = z.object({
  error: z.string().optional(),
  search_information: z
    .object({ query_displayed: z.string().optional() })
    .optional(),
  local_results: z.array(mapsPlaceSchema).optional().default([]),
  serpapi_pagination: z.object({ next: z.string().optional() }).optional(),
});

const reviewTopicSchema = z.object({
  keyword: z.string(),
  mentions: z.number().nonnegative(),
  id: z.string().optional(),
});

export type ReviewTopic = z.infer<typeof reviewTopicSchema>;

const reviewItemSchema = z.object({
  rating: z.number(),
  date: z.string().optional(),
  iso_date: z.string().optional(),
  snippet: z.string().optional(),
  likes: z.number().optional(),
  user: z.object({ name: z.string().optional() }).optional(),
});

export type ReviewItem = z.infer<typeof reviewItemSchema>;

const reviewsResponseSchema = z.object({
  error: z.string().optional(),
  place_info: z
    .object({
      title: z.string().optional(),
      address: z.string().optional(),
      rating: z.number().optional(),
      reviews: z.number().optional(),
      type: z.string().optional(),
    })
    .optional(),
  topics: z.array(reviewTopicSchema).optional().default([]),
  reviews: z.array(reviewItemSchema).optional().default([]),
});

export type PlaceReviews = z.infer<typeof reviewsResponseSchema>;

const trendPointSchema = z.object({
  date: z.string(),
  timestamp: z.string().optional().default(""),
  values: z.array(
    z.object({
      query: z.string(),
      value: z.string().optional().default("0"),
      extracted_value: z.number().default(0),
    }),
  ),
});

const trendsResponseSchema = z.object({
  error: z.string().optional(),
  interest_over_time: z
    .object({ timeline_data: z.array(trendPointSchema).optional().default([]) })
    .optional(),
});

export type TrendsTimelinePoint = z.infer<typeof trendPointSchema>;

function isRateLimitMessage(msg: string): boolean {
  return /rate\s*limit|too\s*many\s*requests|out\s*of\s*searches|credit.*exhausted|monthly.*limit|429/i.test(
    msg,
  );
}

function isAuthErrorMessage(msg: string): boolean {
  return /invalid\s*api\s*key|unauthorized|missing\s*api\s*key|forbidden|account.*suspended/i.test(
    msg,
  );
}

function isEmptyMapsResultMessage(msg: string): boolean {
  return /hasn't returned any results|no results found|no places found/i.test(msg);
}

async function callSerpApi(
  params: Record<string, string | number | boolean>,
  operation: string,
): Promise<unknown> {
  const api_key = requireKey();
  let raw: unknown;

  try {
    const fetchPromise = getJson({
      ...params,
      api_key,
      timeout: DEFAULT_TIMEOUT_MS,
    }) as Promise<unknown>;

    raw = await withTimeout(
      fetchPromise,
      DEFAULT_TIMEOUT_MS + 1000,
      operation,
    );
  } catch (err) {
    if (err instanceof SerpApiError) {
      throw err;
    }
    const rawMessage = err instanceof Error ? err.message : String(err);
    logSafeError(`Call failed for ${operation}`, err);

    if (isRateLimitMessage(rawMessage)) {
      throw new SerpApiRateLimitError();
    }
    if (isAuthErrorMessage(rawMessage)) {
      throw new SerpApiAuthError();
    }
    throw new SerpApiError("External search service is temporarily unavailable.", {
      statusCode: 502,
      code: "UPSTREAM_FETCH_FAILED",
      cause: err,
    });
  }

  // Check for error payload from SerpApi
  if (typeof raw === "object" && raw !== null && "error" in raw) {
    const errField = String((raw as { error?: unknown }).error ?? "");
    if (errField.length > 0) {
      if (isEmptyMapsResultMessage(errField)) {
        // Valid zero-results state from Google Maps
        return { local_results: [] };
      }
      if (isRateLimitMessage(errField)) {
        logSafeError(`Provider rate limit hit on ${operation}`, errField);
        throw new SerpApiRateLimitError();
      }
      if (isAuthErrorMessage(errField)) {
        logSafeError(`Provider auth error on ${operation}`, errField);
        throw new SerpApiAuthError();
      }
      logSafeError(`Provider returned error for ${operation}`, errField);
      throw new SerpApiError("External data provider returned an error.", {
        statusCode: 502,
        code: "UPSTREAM_ERROR_PAYLOAD",
      });
    }
  }

  return raw;
}

export interface MapsSearchInput {
  q: string;
  ll?: string;
  start?: number;
}

export async function fetchMapsPlaces(
  input: MapsSearchInput,
): Promise<MapsPlace[]> {
  const params: Record<string, string | number | boolean> = {
    engine: "google_maps",
    type: "search",
    q: input.q,
    hl: "en",
    gl: "in",
  };
  if (input.ll) params.ll = input.ll;
  if (input.start !== undefined) params.start = input.start;

  const raw = await callSerpApi(params, `Maps: ${input.q}`);
  const parsed = mapsResponseSchema.safeParse(raw);
  if (!parsed.success) {
    logSafeError("Maps response failed schema validation", parsed.error);
    // Graceful fallback: extract any valid places
    if (
      typeof raw === "object" &&
      raw !== null &&
      "local_results" in raw &&
      Array.isArray((raw as { local_results: unknown }).local_results)
    ) {
      return (raw as { local_results: unknown[] }).local_results
        .map((p) => mapsPlaceSchema.safeParse(p))
        .filter((r): r is { success: true; data: MapsPlace } => r.success)
        .map((r) => r.data);
    }
    return [];
  }
  return parsed.data.local_results;
}

export async function fetchPlaceReviews(
  dataId: string,
): Promise<PlaceReviews> {
  const cached = getCachedPlaceReviews(dataId);
  if (cached) return cached;

  const inFlight = getInFlightPlaceReviews(dataId);
  if (inFlight) return inFlight;

  const promise = (async () => {
    try {
      const raw = await callSerpApi(
        {
          engine: "google_maps_reviews",
          data_id: dataId,
          hl: "en",
        },
        `Reviews: ${dataId}`,
      );
      const parsed = reviewsResponseSchema.safeParse(raw);
      if (!parsed.success) {
        logSafeError(`Reviews schema validation failed for ${dataId}`, parsed.error);
        return { topics: [], reviews: [] };
      }
      setCachedPlaceReviews(dataId, parsed.data);
      return parsed.data;
    } finally {
      clearInFlightPlaceReviews(dataId);
    }
  })();

  setInFlightPlaceReviews(dataId, promise);
  return promise;
}

export interface TrendsSearchInput {
  /** Comma-separated, max 5 queries. First query is the target category. */
  q: string;
  geo: string;
  date: string;
}

export async function fetchTrends(
  input: TrendsSearchInput,
): Promise<TrendsTimelinePoint[]> {
  const cacheKey = getTrendsCacheKey(input);
  const cached = getCachedTrends(cacheKey);
  if (cached) return cached;

  const inFlight = getInFlightTrends(cacheKey);
  if (inFlight) return inFlight;

  const promise = (async () => {
    try {
      const raw = await callSerpApi(
        {
          engine: "google_trends",
          data_type: "TIMESERIES",
          q: input.q,
          geo: input.geo,
          date: input.date,
        },
        `Trends: ${input.q}`,
      );
      const parsed = trendsResponseSchema.safeParse(raw);
      if (!parsed.success) {
        logSafeError("Trends schema validation failed", parsed.error);
        return [];
      }
      const timeline = parsed.data.interest_over_time?.timeline_data ?? [];
      setCachedTrends(cacheKey, timeline);
      return timeline;
    } finally {
      clearInFlightTrends(cacheKey);
    }
  })();

  setInFlightTrends(cacheKey, promise);
  return promise;
}

export function isSerpApiConfigured(): boolean {
  return (serverEnv.SERPAPI_KEY ?? "").trim().length > 0;
}
