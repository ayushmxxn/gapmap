import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
global.fetch = fetchMock as unknown as typeof fetch;

vi.mock("@/lib/mode", () => ({
  isMockMode: () => false,
}));

vi.mock("@/lib/mapbox", () => ({
  getMapboxToken: () => "pk.test_mapbox_token_12345",
  isMapboxConfigured: () => true,
  MAPBOX_STYLE: "mapbox://styles/mapbox/dark-v11",
}));

import { reverseGeocode, searchPlaces } from "@/lib/mapbox-geocoding";

describe("Mapbox Geocoding: Defensive Timeout Handling", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("passes an AbortSignal timeout to forward geocoding fetch", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        features: [
          {
            id: "place.123",
            text: "Indiranagar",
            place_name: "Indiranagar, Bengaluru",
            center: [77.6412, 12.9784],
            place_type: ["neighborhood"],
          },
        ],
      }),
    });

    const results = await searchPlaces("indiranagar unique test 1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const options = fetchMock.mock.calls[0][1];
    expect(options).toHaveProperty("signal");
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toBe("Indiranagar");
  });

  it("fails gracefully to fallback results when forward geocoding times out", async () => {
    // Simulate AbortSignal timeout rejection
    fetchMock.mockRejectedValueOnce(
      new DOMException("The operation was aborted due to timeout", "TimeoutError"),
    );

    // Query a known place label so fallbackResults finds it
    const results = await searchPlaces("Koramangala");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(Array.isArray(results)).toBe(true);
    // Graceful fallback returns known preset instead of throwing
    expect(results.some((r) => r.name.toLowerCase().includes("koramangala"))).toBe(true);
  });

  it("passes an AbortSignal timeout to reverse geocoding fetch", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        features: [
          {
            text: "Cyber City",
            place_name: "Cyber City, Gurugram",
          },
        ],
      }),
    });

    // Use coordinates far from any preset to trigger network reverse geocode
    const label = await reverseGeocode(45.123, -73.456);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const options = fetchMock.mock.calls[0][1];
    expect(options).toHaveProperty("signal");
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(label).toBe("Cyber City, Gurugram");
  });

  it("fails gracefully to 'Selected location' when reverse geocoding times out", async () => {
    fetchMock.mockRejectedValueOnce(
      new DOMException("The operation was aborted due to timeout", "TimeoutError"),
    );

    const label = await reverseGeocode(52.52, 13.405);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(label).toBe("Selected location");
  });
});
