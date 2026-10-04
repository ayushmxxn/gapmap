import { AREA_PRESETS, CATEGORIES } from "@/lib/categories";
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
  // Multi-word phrases first
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
  // Single-word terms
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

export interface KnownPlace {
  id: string;
  label: string;
  lat: number;
  lng: number;
  type: "city" | "neighborhood";
}

export const KNOWN_PLACES: KnownPlace[] = [
  ...AREA_PRESETS.map((p) => ({ ...p, type: "neighborhood" as const })),
  // Tier 1 Metro Areas & Major Neighborhoods
  { id: "koramangala", label: "Koramangala, Bengaluru", lat: 12.9352, lng: 77.6245, type: "neighborhood" },
  { id: "indiranagar", label: "Indiranagar, Bengaluru", lat: 12.9784, lng: 77.6408, type: "neighborhood" },
  { id: "hsr-layout", label: "HSR Layout, Bengaluru", lat: 12.9121, lng: 77.6446, type: "neighborhood" },
  { id: "whitefield", label: "Whitefield, Bengaluru", lat: 12.9698, lng: 77.7499, type: "neighborhood" },
  { id: "jayanagar", label: "Jayanagar, Bengaluru", lat: 12.9308, lng: 77.5838, type: "neighborhood" },
  { id: "jp-nagar", label: "JP Nagar, Bengaluru", lat: 12.9063, lng: 77.5857, type: "neighborhood" },
  { id: "bengaluru", label: "Bengaluru, Karnataka", lat: 12.9716, lng: 77.5946, type: "city" },
  { id: "bangalore", label: "Bengaluru, Karnataka", lat: 12.9716, lng: 77.5946, type: "city" },

  { id: "bandra-west", label: "Bandra West, Mumbai", lat: 19.0596, lng: 72.8295, type: "neighborhood" },
  { id: "bandra-east", label: "Bandra East, Mumbai", lat: 19.0626, lng: 72.8512, type: "neighborhood" },
  { id: "andheri-west", label: "Andheri West, Mumbai", lat: 19.1363, lng: 72.8277, type: "neighborhood" },
  { id: "juhu", label: "Juhu, Mumbai", lat: 19.1075, lng: 72.8263, type: "neighborhood" },
  { id: "powai", label: "Powai, Mumbai", lat: 19.1176, lng: 72.9060, type: "neighborhood" },
  { id: "colaba", label: "Colaba, Mumbai", lat: 18.9067, lng: 72.8147, type: "neighborhood" },
  { id: "mumbai", label: "Mumbai, Maharashtra", lat: 19.076, lng: 72.8777, type: "city" },

  { id: "hauz-khas", label: "Hauz Khas, New Delhi", lat: 28.5494, lng: 77.2001, type: "neighborhood" },
  { id: "connaught-place", label: "Connaught Place, New Delhi", lat: 28.6315, lng: 77.2167, type: "neighborhood" },
  { id: "south-extension", label: "South Extension, New Delhi", lat: 28.5729, lng: 77.2215, type: "neighborhood" },
  { id: "saket", label: "Saket, New Delhi", lat: 28.5244, lng: 77.2185, type: "neighborhood" },
  { id: "delhi", label: "Delhi, NCR", lat: 28.6139, lng: 77.209, type: "city" },
  { id: "new-delhi", label: "New Delhi, Delhi", lat: 28.6139, lng: 77.209, type: "city" },
  { id: "gurgaon", label: "Gurugram, Haryana", lat: 28.4595, lng: 77.0266, type: "city" },
  { id: "gurugram", label: "Gurugram, Haryana", lat: 28.4595, lng: 77.0266, type: "city" },
  { id: "noida", label: "Noida, Uttar Pradesh", lat: 28.5355, lng: 77.391, type: "city" },

  { id: "gwalior", label: "Gwalior, Madhya Pradesh", lat: 26.2183, lng: 78.1828, type: "city" },
  { id: "pune", label: "Pune, Maharashtra", lat: 18.5204, lng: 73.8567, type: "city" },
  { id: "koregaon-park", label: "Koregaon Park, Pune", lat: 18.5362, lng: 73.894, type: "neighborhood" },
  { id: "baner", label: "Baner, Pune", lat: 18.559, lng: 73.7868, type: "neighborhood" },
  { id: "hyderabad", label: "Hyderabad, Telangana", lat: 17.385, lng: 78.4867, type: "city" },
  { id: "jubilee-hills", label: "Jubilee Hills, Hyderabad", lat: 17.4319, lng: 78.4073, type: "neighborhood" },
  { id: "madhapur", label: "Madhapur, Hyderabad", lat: 17.4483, lng: 78.3915, type: "neighborhood" },
  { id: "chennai", label: "Chennai, Tamil Nadu", lat: 13.0827, lng: 80.2707, type: "city" },
  { id: "kolkata", label: "Kolkata, West Bengal", lat: 22.5726, lng: 88.3639, type: "city" },
  { id: "jaipur", label: "Jaipur, Rajasthan", lat: 26.9124, lng: 75.7873, type: "city" },
  { id: "ahmedabad", label: "Ahmedabad, Gujarat", lat: 23.0225, lng: 72.5714, type: "city" },
  { id: "chandigarh", label: "Chandigarh, Punjab", lat: 30.7333, lng: 76.7794, type: "city" },
  { id: "kochi", label: "Kochi, Kerala", lat: 9.9312, lng: 76.2673, type: "city" },
  { id: "indore", label: "Indore, Madhya Pradesh", lat: 22.7196, lng: 75.8577, type: "city" },
  { id: "bhopal", label: "Bhopal, Madhya Pradesh", lat: 23.2599, lng: 77.4126, type: "city" },
  { id: "lucknow", label: "Lucknow, Uttar Pradesh", lat: 26.8467, lng: 80.9462, type: "city" },
];

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

  // 1. Check if query starts with a preposition (e.g. "in Koramangala", "near Bandra")
  const startsWithPrep = clean.match(/^(?:in|near|at|around)\s+(.+)$/i);
  if (startsWithPrep && startsWithPrep[1]) {
    return {
      businessText: "",
      locationText: startsWithPrep[1].trim(),
    };
  }

  // 2. Check if query ends with a preposition (e.g. "Cafe in", "Bakery near")
  const endsWithPrep = clean.match(/^(.*?)\s+(?:in|near|at|around)\s*$/i);
  if (endsWithPrep && endsWithPrep[1]) {
    return {
      businessText: endsWithPrep[1].trim(),
      locationText: "",
    };
  }

  // 3. Check for comma separator (e.g. "Cafe, Koramangala", "Bakery, ")
  const commaMatch = clean.match(/^(.*?),\s*(.*)$/);
  if (commaMatch && commaMatch[1]) {
    return {
      businessText: commaMatch[1].trim(),
      locationText: commaMatch[2] ? commaMatch[2].trim() : "",
    };
  }

  // 4. Check for preposition in middle (e.g. "Cafe in Koramangala", "Walk in clinic in Hauz Khas")
  // Greedy ^(.*) matches the last preposition, correctly grouping business names that contain 'in'
  const prepMatch = clean.match(/^(.*)\s+(?:in|near|at|around)\s+(.*)$/i);
  if (prepMatch && prepMatch[1] && prepMatch[2]) {
    return {
      businessText: prepMatch[1].trim(),
      locationText: prepMatch[2].trim(),
    };
  }

  const lower = clean.toLowerCase();

  // 5. Check if query starts with a known business prefix without prepositions
  // (e.g. "Bakery Bandra West", "Pet grooming Hauz Khas", "gym delhi")
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

  // 6. Check if query ends with any known location suffix
  // (e.g. "Tattoo studio Bandra West", "Pottery workshop Koramangala", "Specialty coffee Delhi")
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

  // 7. Check if entire query matches a known location preset
  const matchedPreset = findMatchingPreset(clean);
  if (matchedPreset) {
    return { businessText: "", locationText: matchedPreset.label };
  }

  // 8. Check if entire query matches a known category
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

  // 9. Two words fallback: "gym delhi", "cafe indiranagar"
  const words = clean.split(/\s+/);
  if (words.length === 2) {
    return {
      businessText: words[0],
      locationText: words[1],
    };
  }

  // 10. Default: assume it is a business query
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
