import { getMapboxToken, isMapboxConfigured } from "@/lib/mapbox";
import { isMockMode } from "@/lib/mode";
import { AREA_PRESETS, KNOWN_PLACES } from "@/lib/places";

export interface GeocodingResult {
  id: string;
  name: string;
  fullAddress: string;
  lat: number;
  lng: number;
  scope?: "city" | "neighborhood";
}

const MAX_GEOCODE_CACHE = 100;
// Abort geocoding quickly so slow network doesn't freeze the search dropdown.
const GEOCODE_TIMEOUT_MS = 6000;
const searchPlacesCache = new Map<string, GeocodingResult[]>();
const reverseGeocodeCache = new Map<string, string>();

export async function searchPlaces(query: string): Promise<GeocodingResult[]> {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  const cached = searchPlacesCache.get(clean);
  if (cached) return cached;

  // Fallback to offline presets when offline or running without a Mapbox token.
  const fallbackResults = () =>
    KNOWN_PLACES.filter((p) =>
      p.label.toLowerCase().includes(clean) ||
      clean.includes(p.label.split(",")[0].toLowerCase()),
    ).map((p) => ({
      id: p.id,
      name: p.label.split(",")[0],
      fullAddress: p.label,
      lat: p.lat,
      lng: p.lng,
      scope: p.type,
    }));

  if (isMockMode() || !isMapboxConfigured()) {
    const results = fallbackResults();
    if (searchPlacesCache.size >= MAX_GEOCODE_CACHE) {
      const oldest = searchPlacesCache.keys().next().value;
      if (oldest) searchPlacesCache.delete(oldest);
    }
    searchPlacesCache.set(clean, results);
    return results;
  }

  try {
    const token = getMapboxToken();
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      clean,
    )}.json?access_token=${token}&autocomplete=true&types=place,locality,neighborhood,address,poi&limit=5`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(GEOCODE_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error("Geocoding failed");
    const data = await res.json();
    if (!data.features || !Array.isArray(data.features)) return [];

    const mapped = data.features.map(
      (f: {
        id: string;
        text: string;
        place_name: string;
        place_type?: string[];
        center: [number, number];
      }) => {
        const isCity =
          Array.isArray(f.place_type) &&
          f.place_type.includes("place") &&
          !f.place_type.includes("neighborhood") &&
          !f.place_type.includes("locality");
        return {
          id: f.id,
          name: f.text || f.place_name.split(",")[0],
          fullAddress: f.place_name,
          lng: f.center[0],
          lat: f.center[1],
          scope: isCity ? ("city" as const) : ("neighborhood" as const),
        };
      },
    );

    if (searchPlacesCache.size >= MAX_GEOCODE_CACHE) {
      const oldest = searchPlacesCache.keys().next().value;
      if (oldest) searchPlacesCache.delete(oldest);
    }
    searchPlacesCache.set(clean, mapped);
    return mapped;
  } catch {
    return fallbackResults();
  }
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string> {
  const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const cached = reverseGeocodeCache.get(cacheKey);
  if (cached) return cached;

  // Snap to nearby known preset names to skip unnecessary reverse geocoding lookups.
  const closePreset = AREA_PRESETS.find((p) => {
    const dLat = Math.abs(p.lat - lat);
    const dLng = Math.abs(p.lng - lng);
    return dLat < 0.05 && dLng < 0.05;
  });
  if (closePreset) {
    reverseGeocodeCache.set(cacheKey, closePreset.label);
    return closePreset.label;
  }

  if (isMockMode() || !isMapboxConfigured()) {
    return "Selected location";
  }

  try {
    const token = getMapboxToken();
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&types=neighborhood,locality,place,address&limit=1`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(GEOCODE_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error("Reverse geocoding failed");
    const data = await res.json();
    const feature = data.features?.[0];
    const resolvedLabel = feature
      ? feature.place_name || feature.text || "Selected location"
      : "Selected location";

    if (reverseGeocodeCache.size >= MAX_GEOCODE_CACHE) {
      const oldest = reverseGeocodeCache.keys().next().value;
      if (oldest) reverseGeocodeCache.delete(oldest);
    }
    reverseGeocodeCache.set(cacheKey, resolvedLabel);
    return resolvedLabel;
  } catch {
    return "Selected location";
  }
}
