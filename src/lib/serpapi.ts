import { serverEnv } from "@/lib/env";

export function isSerpApiConfigured(): boolean {
  return (serverEnv.SERPAPI_KEY ?? "").length > 0;
}

/**
 * SerpApi foundation stub. No product logic yet.
 * Never called in mock mode. Throws in live mode without a key.
 */
export async function serpApiSearch(): Promise<never> {
  throw new Error(
    "SerpApi is not wired yet. Foundation only — no live calls.",
  );
}
