import { distance, point } from "@turf/turf";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export const SCAN_RADIUS_KM = 1.5;

export const CITY_DEFAULT_METRO_RADIUS_KM = 25;

// Keep this calculation in kilometers so the map radius stays consistent.
export function filterWithinRadius<T extends GeoPoint>(
  places: T[],
  center: GeoPoint,
  radiusKm: number = SCAN_RADIUS_KM,
): T[] {
  const origin = point([center.lng, center.lat]);
  return places.filter((p) => {
    if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) return false;
    return distance(origin, point([p.lng, p.lat]), { units: "kilometers" }) <= radiusKm;
  });
}

// Keep city scans bounded so one search doesn't cover the entire country.
export function filterWithinCity<T extends GeoPoint>(
  places: T[],
  center: GeoPoint,
  _cityName?: string,
  maxMetroRadiusKm: number = CITY_DEFAULT_METRO_RADIUS_KM,
): T[] {
  const origin = point([center.lng, center.lat]);

  return places.filter((p) => {
    if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) return false;
    const dist = distance(origin, point([p.lng, p.lat]), { units: "kilometers" });
    return dist <= maxMetroRadiusKm;
  });
}

export function densityPerKm2(count: number, radiusKm: number): number {
  return count / (Math.PI * radiusKm * radiusKm);
}

// Use the 85th percentile to ignore extreme satellite suburbs when framing the map.
export function effectiveSpreadRadiusKm(
  places: GeoPoint[],
  center: GeoPoint,
  fallbackRadiusKm: number = 8,
): number {
  if (places.length === 0) return fallbackRadiusKm;
  const origin = point([center.lng, center.lat]);
  const distances = places
    .map((p) => distance(origin, point([p.lng, p.lat]), { units: "kilometers" }))
    .sort((a, b) => a - b);
  const p85Index = Math.min(distances.length - 1, Math.floor(distances.length * 0.85));
  return Math.max(3.5, Math.min(25, Number(distances[p85Index].toFixed(1))));
}

// Measures competitor clustering density; returns Infinity when fewer than 2 places exist.
export function medianNearestNeighborKm(places: GeoPoint[]): number {
  if (places.length < 2) return Number.POSITIVE_INFINITY;
  const gaps = places.map((p, i) => {
    const origin = point([p.lng, p.lat]);
    let best = Number.POSITIVE_INFINITY;
    for (let j = 0; j < places.length; j += 1) {
      if (i === j) continue;
      const d = distance(origin, point([places[j].lng, places[j].lat]), {
        units: "kilometers",
      });
      if (d < best) best = d;
    }
    return best;
  });
  gaps.sort((a, b) => a - b);
  const mid = Math.floor(gaps.length / 2);
  return gaps.length % 2 === 1
    ? gaps[mid]
    : (gaps[mid - 1] + gaps[mid]) / 2;
}
