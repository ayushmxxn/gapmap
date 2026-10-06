import { CATEGORIES } from "@/lib/categories";
import { KNOWN_PLACES } from "@/lib/places";
import { searchPlaces } from "@/lib/mapbox-geocoding";

export interface ParsedSearch {
  rawQuery: string;
  businessText: string;
  locationText: string;
  categoryId: string;
  categoryLabel: string;
  lat: number | null;
  lng: number | null;
  areaLabel: string | null;
  scope?: "city" | "neighborhood";
  status: "ready" | "needs_location" | "needs_business" | "resolving" | "location_not_found" | "empty";
}

const KNOWN_BUSINESS_PREFIXES = [
  // Longer phrases first to match "ev charging station" before "ev charging".
  "ev charging station",
  "ev charging stations",
  "ev charging",
  "electric vehicle charging",
  "pet grooming",
  "pet groomer",
  "pet groomers",
  "pet store",
  "pet spa",
  "dog grooming",
  "coffee shop",
  "coffee shops",
  "espresso bar",
  "tea house",
  "juice bar",
  "laundromat",
  "laundromats",
  "dry cleaner",
  "dry cleaners",
  "yoga studio",
  "pilates studio",
  "fitness center",
  "fitness club",
  "health club",
  "dental clinic",
  "coworking space",
  "coworking",
  "beauty salon",
  "beauty parlour",
  "hair salon",
  "tattoo studio",
  "nail salon",
  "car wash",
  "auto repair",
  "bicycle shop",
  "flower shop",
  "ice cream shop",
  "burger joint",
  "bakery",
  "bakeries",
  "salon",
  "salons",
  "cafe",
  "cafes",
  "coffee",
  "gym",
  "gyms",
  "fitness",
  "laundry",
  "barber",
  "barbershop",
  "spa",
  "restaurant",
  "bookstore",
  "pharmacy",
  "dentist",
  "boutique",
  "bistro",
  "gelato",
];

export { KNOWN_PLACES, type KnownPlace } from "@/lib/places";

export function parseSearchQuery(rawQuery: string): {
  businessText: string;
  locationText: string;
} {
  const clean = rawQuery
    .trim()
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
    .trim();

  if (!clean) {
    return { businessText: "", locationText: "" };
  }

  const startsWithPrep = clean.match(/^(?:in|near|at|around)\s+(.+)$/i);
  if (startsWithPrep && startsWithPrep[1]) {
    return {
      businessText: "",
      locationText: startsWithPrep[1].trim(),
    };
  }

  const endsWithPrep = clean.match(/^(.*?)\s+(?:in|near|at|around)\s*$/i);
  if (endsWithPrep && endsWithPrep[1]) {
    return {
      businessText: endsWithPrep[1].trim(),
      locationText: "",
    };
  }

  const commaMatch = clean.match(/^(.*?),\s*(.*)$/);
  if (commaMatch && commaMatch[1]) {
    return {
      businessText: commaMatch[1].trim(),
      locationText: commaMatch[2] ? commaMatch[2].trim() : "",
    };
  }

  // Match the last preposition so names like "Walk in clinic in Hauz Khas" split on the second "in".
  const prepMatch = clean.match(/^(.*)\s+(?:in|near|at|around)\s+(.*)$/i);
  if (prepMatch && prepMatch[1] && prepMatch[2]) {
    return {
      businessText: prepMatch[1].trim(),
      locationText: prepMatch[2].trim(),
    };
  }

  const lower = clean.toLowerCase();

  // Sort longest prefix first so specific categories match before general ones.
  const sortedPrefixes = [...KNOWN_BUSINESS_PREFIXES].sort(
    (a, b) => b.length - a.length,
  );
  for (const prefix of sortedPrefixes) {
    if (lower.startsWith(prefix + " ") && lower.length > prefix.length + 1) {
      const remainingLocation = clean.slice(prefix.length).trim();
      if (remainingLocation.length > 0) {
        return {
          businessText: clean.slice(0, prefix.length).trim(),
          locationText: remainingLocation,
        };
      }
    }
  }

  // Sort longest city name first to prevent partial name collisions.
  const sortedPlaces = [...KNOWN_PLACES].sort((a, b) => {
    const aShort = a.label.split(",")[0].trim().length;
    const bShort = b.label.split(",")[0].trim().length;
    return bShort - aShort;
  });

  for (const place of sortedPlaces) {
    const placeCity = place.label.split(",")[0].trim().toLowerCase();
    if (
      lower.endsWith(" " + placeCity) &&
      lower.length > placeCity.length + 1
    ) {
      const candidateBusiness = clean
        .slice(0, clean.length - placeCity.length)
        .trim();
      if (candidateBusiness.length > 0) {
        return {
          businessText: candidateBusiness,
          locationText: place.label,
        };
      }
    }

    const fullPlace = place.label.toLowerCase();
    if (
      lower.endsWith(" " + fullPlace) &&
      lower.length > fullPlace.length + 1
    ) {
      const candidateBusiness = clean
        .slice(0, clean.length - fullPlace.length)
        .trim();
      if (candidateBusiness.length > 0) {
        return {
          businessText: candidateBusiness,
          locationText: place.label,
        };
      }
    }
  }

  const matchedPreset = findMatchingPreset(clean);
  if (matchedPreset) {
    return { businessText: "", locationText: matchedPreset.label };
  }

  if (
    CATEGORIES.some(
      (c) =>
        c.id.toLowerCase() === lower ||
        c.label.toLowerCase() === lower ||
        c.aliases?.some((a) => a.toLowerCase() === lower),
    )
  ) {
    return { businessText: clean, locationText: "" };
  }

  // Treat two unspecified words as business and location (e.g. "gym delhi").
  const words = clean.split(/\s+/);
  if (words.length === 2) {
    return {
      businessText: words[0],
      locationText: words[1],
    };
  }

  return { businessText: clean, locationText: "" };
}

export function findMatchingPreset(locationText: string) {
  const clean = locationText.trim().toLowerCase();
  if (!clean) return null;

  return (
    KNOWN_PLACES.find(
      (p) =>
        p.label.toLowerCase() === clean ||
        p.label.split(",")[0].toLowerCase() === clean ||
        p.id.toLowerCase() === clean,
    ) ||
    KNOWN_PLACES.find(
      (p) =>
        p.label.toLowerCase().includes(clean) ||
        clean.includes(p.label.split(",")[0].toLowerCase()),
    ) ||
    null
  );
}

export async function resolveLocation(locationText: string): Promise<{
  lat: number;
  lng: number;
  areaLabel: string;
  scope: "city" | "neighborhood";
} | null> {
  const clean = locationText.trim();
  if (!clean) return null;

  const preset = findMatchingPreset(clean);
  if (preset) {
    return {
      lat: preset.lat,
      lng: preset.lng,
      areaLabel: preset.label,
      scope: ("type" in preset && preset.type === "neighborhood") ? "neighborhood" : "city",
    };
  }

  try {
    const results = await searchPlaces(clean);
    if (results.length > 0) {
      return {
        lat: results[0].lat,
        lng: results[0].lng,
        areaLabel: results[0].fullAddress || results[0].name,
        scope: results[0].scope ?? "city",
      };
    }
  } catch {
    return null;
  }

  return null;
}
