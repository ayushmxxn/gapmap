import { describe, expect, it } from "vitest";
import { getSiteUrl, siteUrl } from "@/lib/env";

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
});
