import { distance, point } from "@turf/turf";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export const SCAN_RADIUS_KM = 1.5;

/** Keep only places with coordinates inside the scan radius. */
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

export function densityPerKm2(count: number, radiusKm: number): number {
  return count / (Math.PI * radiusKm * radiusKm);
}

/** Median nearest-neighbour distance in km; Infinity when < 2 points. */
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
