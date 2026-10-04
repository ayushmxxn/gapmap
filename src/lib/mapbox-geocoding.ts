import { getMapboxToken, isMapboxConfigured } from "@/lib/mapbox";
import { AREA_PRESETS } from "@/lib/categories";

export interface GeocodingResult {
  id: string;
  name: string;
  fullAddress: string;
  lat: number;
  lng: number;
}

export async function searchPlaces(query: string): Promise<GeocodingResult[]> {
  const clean = query.trim();
  if (!clean) return [];

  if (!isMapboxConfigured()) {
    return AREA_PRESETS.filter((p) =>
      p.label.toLowerCase().includes(clean.toLowerCase()),
    ).map((p) => ({
      id: p.id,
      name: p.label.split(",")[0],
      fullAddress: p.label,
      lat: p.lat,
      lng: p.lng,
    }));
  }

  try {
    const token = getMapboxToken();
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      clean,
    )}.json?access_token=${token}&autocomplete=true&types=place,locality,neighborhood,address,poi&limit=5`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Geocoding failed");
    const data = await res.json();
    if (!data.features || !Array.isArray(data.features)) return [];

    return data.features.map(
      (f: {
        id: string;
        text: string;
        place_name: string;
        center: [number, number];
      }) => ({
        id: f.id,
        name: f.text || f.place_name.split(",")[0],
        fullAddress: f.place_name,
        lng: f.center[0],
        lat: f.center[1],
      }),
    );
  } catch {
    return AREA_PRESETS.filter((p) =>
      p.label.toLowerCase().includes(clean.toLowerCase()),
    ).map((p) => ({
      id: p.id,
      name: p.label.split(",")[0],
      fullAddress: p.label,
      lat: p.lat,
      lng: p.lng,
    }));
  }
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string> {
  // If close to a preset, use the preset name
  const closePreset = AREA_PRESETS.find((p) => {
    const dLat = Math.abs(p.lat - lat);
    const dLng = Math.abs(p.lng - lng);
    return dLat < 0.05 && dLng < 0.05;
  });
  if (closePreset) return closePreset.label;

  if (!isMapboxConfigured()) {
    return "Selected location";
  }

  try {
    const token = getMapboxToken();
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&types=neighborhood,locality,place,address&limit=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Reverse geocoding failed");
    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature) return "Selected location";
    return feature.place_name || feature.text || "Selected location";
  } catch {
    return "Selected location";
  }
}
