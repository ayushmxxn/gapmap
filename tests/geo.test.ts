import { describe, expect, it } from "vitest";
import {
  densityPerKm2,
  effectiveSpreadRadiusKm,
  filterWithinCity,
  filterWithinRadius,
  medianNearestNeighborKm,
  type GeoPoint,
} from "@/lib/geo";

describe("Geospatial: filterWithinRadius", () => {
  const center: GeoPoint = { lat: 12.9352, lng: 77.6245 }; // Koramangala

  it("returns empty array when input is empty", () => {
    expect(filterWithinRadius([], center, 1.5)).toEqual([]);
  });

  it("filters out invalid/non-finite coordinates", () => {
    const invalid: GeoPoint[] = [
      { lat: Number.NaN, lng: 77.6245 },
      { lat: 12.9352, lng: Number.POSITIVE_INFINITY },
    ];
    expect(filterWithinRadius(invalid, center, 1.5)).toEqual([]);
  });

  it("includes points within radius and excludes points outside radius", () => {
    const places: (GeoPoint & { name: string })[] = [
      { name: "Center", lat: 12.9352, lng: 77.6245 }, // 0 km
      { name: "Close (0.5km)", lat: 12.939, lng: 77.6245 }, // ~0.42 km
      { name: "Far (5km)", lat: 12.98, lng: 77.6245 }, // ~5.0 km
    ];

    const filtered = filterWithinRadius(places, center, 1.5);
    expect(filtered.map((p) => p.name)).toEqual(["Center", "Close (0.5km)"]);
  });
});

describe("Geospatial: filterWithinCity", () => {
  const center: GeoPoint = { lat: 28.6139, lng: 77.209 }; // New Delhi

  it("returns empty array when input is empty", () => {
    expect(filterWithinCity([], center, "Delhi")).toEqual([]);
  });

  it("includes metropolitan locations within maxMetroRadiusKm and excludes distant cities", () => {
    const places = [
      { name: "Connaught Place", lat: 28.6315, lng: 77.2167 }, // ~2 km
      { name: "Noida Sector 18", lat: 28.5708, lng: 77.3261 }, // ~12 km (metro area)
      { name: "Jaipur", lat: 26.9124, lng: 75.7873 }, // ~240 km (distant city)
    ];

    const filtered = filterWithinCity(places, center, "Delhi", 25);
    expect(filtered.map((p) => p.name)).toEqual([
      "Connaught Place",
      "Noida Sector 18",
    ]);
  });
});

describe("Geospatial: densityPerKm2", () => {
  it("computes 0 density for 0 count", () => {
    expect(densityPerKm2(0, 1.5)).toBe(0);
  });

  it("calculates exact spatial density per square kilometer", () => {
    // Area of circle with r=1 km is Math.PI (~3.14159)
    // 10 places in 1 km radius = 10 / Math.PI ≈ 3.183
    const density = densityPerKm2(10, 1);
    expect(density).toBeCloseTo(10 / Math.PI, 3);
  });
});

describe("Geospatial: effectiveSpreadRadiusKm", () => {
  const center: GeoPoint = { lat: 12.9352, lng: 77.6245 };

  it("returns fallback radius when places array is empty", () => {
    expect(effectiveSpreadRadiusKm([], center, 8)).toBe(8);
  });

  it("calculates 85th percentile spread and respects minimum 3.5km clamp", () => {
    // 10 points all within 0.1km of center
    const tightCluster: GeoPoint[] = Array.from({ length: 10 }, (_, i) => ({
      lat: center.lat + i * 0.0001,
      lng: center.lng + i * 0.0001,
    }));

    const radius = effectiveSpreadRadiusKm(tightCluster, center);
    expect(radius).toBe(3.5); // Minimum clamp
  });

  it("calculates 85th percentile spread and respects maximum 25km clamp", () => {
    // Points spread far out beyond 30km
    const wideCluster: GeoPoint[] = Array.from({ length: 10 }, (_, i) => ({
      lat: center.lat + i * 0.5,
      lng: center.lng + i * 0.5,
    }));

    const radius = effectiveSpreadRadiusKm(wideCluster, center);
    expect(radius).toBe(25); // Maximum clamp
  });
});

describe("Geospatial: medianNearestNeighborKm", () => {
  it("returns positive Infinity for fewer than 2 points", () => {
    expect(medianNearestNeighborKm([])).toBe(Number.POSITIVE_INFINITY);
    expect(medianNearestNeighborKm([{ lat: 12.9, lng: 77.6 }])).toBe(
      Number.POSITIVE_INFINITY,
    );
  });

  it("returns 0 for identical coordinates", () => {
    const points: GeoPoint[] = [
      { lat: 12.9352, lng: 77.6245 },
      { lat: 12.9352, lng: 77.6245 },
    ];
    expect(medianNearestNeighborKm(points)).toBe(0);
  });

  it("calculates median nearest-neighbor distance correctly for odd count", () => {
    // 3 collinear points along latitude spaced roughly ~1.11km apart (0.01 deg lat ≈ 1.11 km)
    const points: GeoPoint[] = [
      { lat: 12.91, lng: 77.62 },
      { lat: 12.92, lng: 77.62 },
      { lat: 12.93, lng: 77.62 },
    ];

    const median = medianNearestNeighborKm(points);
    expect(median).toBeGreaterThan(1.0);
    expect(median).toBeLessThan(1.2);
  });

  it("calculates median nearest-neighbor distance correctly for even count", () => {
    const points: GeoPoint[] = [
      { lat: 12.91, lng: 77.62 },
      { lat: 12.92, lng: 77.62 },
      { lat: 12.93, lng: 77.62 },
      { lat: 12.94, lng: 77.62 },
    ];

    const median = medianNearestNeighborKm(points);
    expect(median).toBeGreaterThan(1.0);
    expect(median).toBeLessThan(1.2);
  });
});
