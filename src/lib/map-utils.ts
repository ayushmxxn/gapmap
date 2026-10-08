import type { Competitor } from "@/types/scan";

// Fits the 3D globe within the viewport regardless of window aspect ratio.
export function getOptimalGlobeZoom(
  width: number,
  height: number,
  targetRatio = 0.7,
): number {
  if (!width || !height) return 1.35;
  const minDim = Math.min(width, height);
  const targetDiameter = minDim * targetRatio;
  const fovRad = (36.86989764584402 * Math.PI) / 180;
  const focalLength = height / 2 / Math.tan(fovRad / 2);
  const targetRadius = targetDiameter / 2;
  const t = targetRadius / focalLength;
  const s = t / Math.sqrt(1 + t * t);
  const globeRadius = (s / (1 - s)) * focalLength;
  const zoom = Math.log2((2 * Math.PI * globeRadius) / 512);
  return Math.max(0.4, Math.min(2.5, Number(zoom.toFixed(2))));
}

export function pinColor(rating: number | undefined): string {
  if (rating == null) return "#71717a";
  if (rating >= 4.3) return "#16a34a";
  if (rating >= 3.7) return "#d97706";
  return "#dc2626";
}

export function competitorKey(c: Competitor): string {
  return `${c.title}-${c.lat}-${c.lng}`;
}

/**
 * Builds a direct Google Maps URL for a place or business.
 * Prefers the Google Maps place ID when available (universal URL query_place_id);
 * otherwise builds a search query URL using the business name and address.
 * Falls back to coordinates if title/address are missing, and returns null if no valid data exists.
 */
export function buildGoogleMapsUrl(place: {
  title?: string;
  address?: string;
  placeId?: string;
  lat?: number;
  lng?: number;
}): string | null {
  const cleanTitle = (place.title ?? "").trim();
  const cleanAddress = (place.address ?? "").trim();
  const placeId = (place.placeId ?? "").trim();

  const queryParts = [cleanTitle, cleanAddress].filter(Boolean);
  let query = queryParts.join(", ").trim();

  if (
    !query &&
    place.lat != null &&
    place.lng != null &&
    !Number.isNaN(place.lat) &&
    !Number.isNaN(place.lng)
  ) {
    query = `${place.lat},${place.lng}`;
  }

  if (!query && !placeId) {
    return null;
  }

  const effectiveQuery = query || "Location";
  const params = new URLSearchParams({
    api: "1",
    query: effectiveQuery,
  });

  if (placeId) {
    params.set("query_place_id", placeId);
  }

  return `https://www.google.com/maps/search/?${params.toString()}`;
}
