import { describe, expect, it } from "vitest";
import {
  buildGoogleMapsUrl,
  competitorKey,
  getOptimalGlobeZoom,
  pinColor,
} from "@/lib/map-utils";

describe("Map Utils: buildGoogleMapsUrl", () => {
  it("prefers Google Maps place ID when available", () => {
    const url = buildGoogleMapsUrl({
      title: "Jiwaji Club",
      address: "Mela Ground, Gwalior",
      placeId: "ChIJN1t_tDeuEmsRUsoyG83frY4",
    });

    expect(url).not.toBeNull();
    const parsed = new URL(url!);
    expect(parsed.origin).toBe("https://www.google.com");
    expect(parsed.pathname).toBe("/maps/search/");
    expect(parsed.searchParams.get("api")).toBe("1");
    expect(parsed.searchParams.get("query_place_id")).toBe(
      "ChIJN1t_tDeuEmsRUsoyG83frY4",
    );
    expect(parsed.searchParams.get("query")).toBe(
      "Jiwaji Club, Mela Ground, Gwalior",
    );
  });

  it("builds a search URL using business name and address when place ID is missing", () => {
    const url = buildGoogleMapsUrl({
      title: "Kk badminton academy",
      address: "DD Nagar, Gwalior, Madhya Pradesh",
    });

    expect(url).not.toBeNull();
    const parsed = new URL(url!);
    expect(parsed.pathname).toBe("/maps/search/");
    expect(parsed.searchParams.get("api")).toBe("1");
    expect(parsed.searchParams.get("query")).toBe(
      "Kk badminton academy, DD Nagar, Gwalior, Madhya Pradesh",
    );
    expect(parsed.searchParams.has("query_place_id")).toBe(false);
  });

  it("builds a search URL using business name only when address is missing", () => {
    const url = buildGoogleMapsUrl({
      title: "Prime badminton academy",
    });

    expect(url).not.toBeNull();
    const parsed = new URL(url!);
    expect(parsed.searchParams.get("query")).toBe("Prime badminton academy");
    expect(parsed.searchParams.has("query_place_id")).toBe(false);
  });

  it("falls back to latitude and longitude coordinates when name and address are missing", () => {
    const url = buildGoogleMapsUrl({
      lat: 26.2183,
      lng: 78.1828,
    });

    expect(url).not.toBeNull();
    const parsed = new URL(url!);
    expect(parsed.searchParams.get("query")).toBe("26.2183,78.1828");
  });

  it("handles missing location data gracefully by returning null", () => {
    expect(buildGoogleMapsUrl({})).toBeNull();
    expect(buildGoogleMapsUrl({ title: "", address: "   " })).toBeNull();
    expect(
      buildGoogleMapsUrl({
        title: "  ",
        address: "",
        lat: Number.NaN,
        lng: Number.NaN,
      }),
    ).toBeNull();
  });
});

describe("Map Utils: pinColor and competitorKey", () => {
  it("assigns appropriate colors based on rating", () => {
    expect(pinColor(undefined)).toBe("#71717a");
    expect(pinColor(4.5)).toBe("#16a34a");
    expect(pinColor(4.0)).toBe("#d97706");
    expect(pinColor(3.2)).toBe("#dc2626");
  });

  it("computes distinct competitor keys", () => {
    const key = competitorKey({
      title: "Gymkhana",
      lat: 19.076,
      lng: 72.8777,
      evidence: "maps-1",
    });
    expect(key).toBe("Gymkhana-19.076-72.8777");
  });

  it("computes optimal globe zoom within bounds", () => {
    expect(getOptimalGlobeZoom(0, 0)).toBe(1.35);
    const zoom = getOptimalGlobeZoom(1920, 1080);
    expect(zoom).toBeGreaterThanOrEqual(0.4);
    expect(zoom).toBeLessThanOrEqual(2.5);
  });

  it("formats popup details line combining category and address", () => {
    const formatSubtitle = (placeType?: string, address?: string) =>
      [placeType, address].filter(Boolean).join(" · ");

    expect(formatSubtitle("Badminton court", "DD Nagar, Gwalior")).toBe(
      "Badminton court · DD Nagar, Gwalior",
    );
    expect(formatSubtitle("Cafe", undefined)).toBe("Cafe");
    expect(formatSubtitle(undefined, "Koramangala, Bengaluru")).toBe(
      "Koramangala, Bengaluru",
    );
    expect(formatSubtitle(undefined, undefined)).toBe("");
  });
});
