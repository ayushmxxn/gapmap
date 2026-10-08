import { z } from "zod";

// Default to mock mode so the app works immediately after cloning without API keys.

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
  // SerpApi stays server-side so the key never reaches the browser.
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
// Prevent browser bundles from trying to read server-only secrets,
// while dynamically resolving server secrets (such as Cloudflare Worker secrets) at runtime.
export const serverEnv: ServerEnv =
  typeof window === "undefined"
    ? new Proxy({} as ServerEnv, {
        get(_target, prop) {
          if (prop === "SERPAPI_KEY") {
            const globalVal =
              typeof globalThis !== "undefined" && "SERPAPI_KEY" in globalThis
                ? String(
                    (globalThis as unknown as Record<string, unknown>)
                      .SERPAPI_KEY || "",
                  )
                : "";
            const processVal =
              typeof process !== "undefined" && process?.env
                ? process.env.SERPAPI_KEY || process.env.SERPAPI_API_KEY || ""
                : "";
            const resolved = (processVal || globalVal || "").trim();
            return resolved;
          }
          const parsed = readServerEnv();
          return parsed[prop as keyof ServerEnv];
        },
        has(_target, prop) {
          return prop === "SERPAPI_KEY" || prop in readServerEnv();
        },
        ownKeys() {
          return Reflect.ownKeys(readServerEnv());
        },
        getOwnPropertyDescriptor(_target, prop) {
          return Reflect.getOwnPropertyDescriptor(readServerEnv(), prop);
        },
      })
    : (clientEnv as ServerEnv);

// Resolves canonical base URL for OpenGraph and sitemaps.
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
