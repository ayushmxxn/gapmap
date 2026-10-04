/**
 * Curated scan categories. Each carries its Maps query, its Trends query,
 * and up to 4 sibling queries so the Trends demand signal is benchmarked
 * inside a SINGLE google_trends call (max 5 queries per TIMESERIES search).
 */
export interface Category {
  id: string;
  label: string;
  mapsQuery: string;
  trendsQuery: string;
  /** Sibling trend queries, target excluded. Target + siblings <= 5. */
  siblings: string[];
}

export const CATEGORIES: Category[] = [
  {
    id: "cafe",
    label: "Cafe",
    mapsQuery: "cafe",
    trendsQuery: "cafe",
    siblings: ["bakery", "salon", "gym"],
  },
  {
    id: "bakery",
    label: "Bakery",
    mapsQuery: "bakery",
    trendsQuery: "bakery",
    siblings: ["cafe", "salon", "gym"],
  },
  {
    id: "salon",
    label: "Salon",
    mapsQuery: "salon",
    trendsQuery: "salon",
    siblings: ["cafe", "spa", "barber"],
  },
  {
    id: "gym",
    label: "Gym",
    mapsQuery: "gym",
    trendsQuery: "gym",
    siblings: ["yoga studio", "cafe", "salon"],
  },
  {
    id: "laundromat",
    label: "Laundromat",
    mapsQuery: "laundromat",
    trendsQuery: "laundromat",
    siblings: ["dry cleaner", "salon", "cafe"],
  },
  {
    id: "pet-grooming",
    label: "Pet grooming",
    mapsQuery: "pet grooming",
    trendsQuery: "pet grooming",
    siblings: ["veterinary", "pet store", "salon"],
  },
];

export function getCategory(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function resolveCategory(idOrQuery: string): Category {
  const trimmed = idOrQuery.trim();
  if (!trimmed) {
    return CATEGORIES[0];
  }
  const existing = CATEGORIES.find(
    (c) =>
      c.id.toLowerCase() === trimmed.toLowerCase() ||
      c.label.toLowerCase() === trimmed.toLowerCase(),
  );
  if (existing) return existing;

  const normalized = trimmed.replace(/[-_]+/g, " ");
  const label = normalized
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

  return {
    id: normalized.toLowerCase().replace(/\s+/g, "-"),
    label,
    mapsQuery: normalized.toLowerCase(),
    trendsQuery: normalized.toLowerCase(),
    siblings: [],
  };
}

/** Preset Indian demo areas. Coordinates are public neighbourhood centroids. */
export interface AreaPreset {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

export const AREA_PRESETS: AreaPreset[] = [
  { id: "koramangala", label: "Koramangala, Bengaluru", lat: 12.9352, lng: 77.6245 },
  { id: "indiranagar", label: "Indiranagar, Bengaluru", lat: 12.9784, lng: 77.6408 },
  { id: "bandra-west", label: "Bandra West, Mumbai", lat: 19.0596, lng: 72.8295 },
  { id: "hauz-khas", label: "Hauz Khas, New Delhi", lat: 28.5494, lng: 77.2001 },
];
