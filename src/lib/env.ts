import { z } from "zod";

/**
 * GapMap Environment Variable Architecture
 *
 * 1. Server-Only Secrets:
 *    - SERPAPI_KEY: Private API key for Google Maps, Reviews, and Trends ingestion.
 *      Must NEVER be prefixed with NEXT_PUBLIC_ and must never reach the browser bundle.
 *    - VERCEL_PROJECT_PRODUCTION_URL: Injected automatically by Vercel for preview/production.
 *
 * 2. Intentionally Public Client Configuration:
 *    - NEXT_PUBLIC_MAPBOX_TOKEN: Public access token required by Mapbox GL JS running
 *      in the browser for vector map rendering and client-side geocoding.
 *    - NEXT_PUBLIC_USE_MOCK: Client-visible runtime/build flag (default: true). Must remain
 *      public so browser search hooks & map interactions can bypass external Mapbox API
 *      calls when running offline in zero-key mock mode without network round-trips.
 *    - NEXT_PUBLIC_APP_URL: Public canonical URL for OpenGraph, sitemap, and metadata generation.
 */

const clientSchema = z.object({
  NEXT_PUBLIC_USE_MOCK: z
    .enum(["true", "false"])
    .or(z.literal(""))
    .default("true")
    .transform((v) => v !== "false"),
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().optional().default(""),
  NEXT_PUBLIC_APP_URL: z.string().url().optional().or(z.literal("")),
});

const serverSchema = clientSchema.extend({
  SERPAPI_KEY: z.string().optional().default(""),
});

export type ClientEnv = z.infer<typeof clientSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

function readClientEnv(): ClientEnv {
  return clientSchema.parse({
    NEXT_PUBLIC_USE_MOCK: process.env.NEXT_PUBLIC_USE_MOCK,
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
}

function readServerEnv(): ServerEnv {
  return serverSchema.parse({
    NEXT_PUBLIC_USE_MOCK: process.env.NEXT_PUBLIC_USE_MOCK,
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    SERPAPI_KEY:
      process.env.SERPAPI_KEY || process.env.SERPAPI_API_KEY || "",
  });
}

export const clientEnv = readClientEnv();
export const serverEnv =
  typeof window === "undefined" ? readServerEnv() : (clientEnv as ServerEnv);

/**
 * Returns the canonical base URL of the application.
 * Priority: NEXT_PUBLIC_APP_URL -> Vercel Production URL -> https://gapmap.app
 */
export function getSiteUrl(): string {
  const configured =
    clientEnv.NEXT_PUBLIC_APP_URL ||
    (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_APP_URL : undefined);
  if (configured && configured.trim().length > 0) {
    return configured.replace(/\/+$/, "");
  }
  if (
    typeof process !== "undefined" &&
    process.env.VERCEL_PROJECT_PRODUCTION_URL
  ) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`.replace(
      /\/+$/,
      "",
    );
  }
  return "https://gapmap.app";
}

export const siteUrl = getSiteUrl();
