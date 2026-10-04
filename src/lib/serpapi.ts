import { z } from "zod";
import { getJson } from "serpapi";
import { serverEnv } from "@/lib/env";

/**
 * Server-side SerpApi client. Never import from client components.
 *
 * Schemas frozen from official docs (google-maps, google-maps-reviews,
 * google-trends). Unknown keys are stripped by Zod; every consumed field is
 * optional except proven-required ones, so payload drift fails soft, not loud.
 *
 * Pagination note (verified 2026-09-25 against current docs + no live key):
 * `start` carries no documented `ll` incompatibility, but it cannot be
 * verified live, so the MVP issues ONE Maps request (start=0). See
 * MAX_MAPS_PAGES in the scan route.
 */

export class SerpApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SerpApiError";
  }
}

const gpsSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

export const mapsPlaceSchema = z.object({
  position: z.number().optional(),
  title: z.string(),
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
  mentions: z.number(),
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
  timestamp: z.string(),
  values: z.array(
    z.object({
      query: z.string(),
      value: z.string(),
      extracted_value: z.number(),
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

function requireKey(): string {
  const key = serverEnv.SERPAPI_KEY;
  if (!key) {
    throw new SerpApiError("Missing SERPAPI_KEY. Set it in .env.local.");
  }
  return key;
}

async function callSerpApi(
  params: Record<string, string | number | boolean>,
): Promise<unknown> {
  const api_key = requireKey();
  let raw: unknown;
  try {
    raw = (await getJson({ ...params, api_key })) as unknown;
  } catch (err) {
    throw new SerpApiError(
      err instanceof Error ? err.message : "SerpApi request failed.",
    );
  }
  if (typeof raw === "object" && raw !== null && "error" in raw) {
    const errField = (raw as { error?: unknown }).error;
    if (typeof errField === "string" && errField.length > 0) {
      throw new SerpApiError(`SerpApi error: ${errField}`);
    }
  }
  return raw;
}

export interface MapsSearchInput {
  q: string;
  ll: string;
}

export async function fetchMapsPlaces(
  input: MapsSearchInput,
): Promise<MapsPlace[]> {
  const raw = await callSerpApi({
    engine: "google_maps",
    type: "search",
    q: input.q,
    ll: input.ll,
    hl: "en",
    gl: "in",
  });
  return mapsResponseSchema.parse(raw).local_results;
}

export async function fetchPlaceReviews(
  dataId: string,
): Promise<PlaceReviews> {
  const raw = await callSerpApi({
    engine: "google_maps_reviews",
    data_id: dataId,
    hl: "en",
  });
  return reviewsResponseSchema.parse(raw);
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
  const raw = await callSerpApi({
    engine: "google_trends",
    data_type: "TIMESERIES",
    q: input.q,
    geo: input.geo,
    date: input.date,
  });
  const parsed = trendsResponseSchema.parse(raw);
  return parsed.interest_over_time?.timeline_data ?? [];
}

export function isSerpApiConfigured(): boolean {
  return (serverEnv.SERPAPI_KEY ?? "").length > 0;
}
