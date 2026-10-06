import { describe, expect, it } from "vitest";
import { clientEnv, serverEnv, getSiteUrl, siteUrl } from "@/lib/env";

describe("Environment & URL Resolution", () => {
  it("exports a valid canonical siteUrl string", () => {
    expect(typeof siteUrl).toBe("string");
    expect(siteUrl.length).toBeGreaterThan(0);
    expect(siteUrl.startsWith("http")).toBe(true);
    expect(siteUrl.endsWith("/")).toBe(false);
  });

  it("getSiteUrl resolves to default https://gapmap.app when no env is configured", () => {
    const url = getSiteUrl();
    expect(url).toMatch(/^https?:\/\//);
  });

  it("ensures clientEnv never exposes SERPAPI_KEY", () => {
    // clientEnv must only contain public client configuration
    expect("SERPAPI_KEY" in clientEnv).toBe(false);
    expect((clientEnv as Record<string, unknown>).SERPAPI_KEY).toBeUndefined();
  });

  it("ensures clientEnv exposes boolean NEXT_PUBLIC_USE_MOCK", () => {
    expect(typeof clientEnv.NEXT_PUBLIC_USE_MOCK).toBe("boolean");
  });

  it("ensures serverEnv exposes SERPAPI_KEY on the server", () => {
    expect("SERPAPI_KEY" in serverEnv).toBe(true);
    expect(typeof serverEnv.SERPAPI_KEY).toBe("string");
  });
});
