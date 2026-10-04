import { KNOWN_PLACES } from "@/lib/search-parser";

export type ScanScopeType = "city" | "neighborhood";

export interface ResolvedScope {
  scope: ScanScopeType;
  label: string;
  cityName: string;
  neighborhoodName?: string;
}

const INDIAN_STATES_AND_UTS = new Set([
  "andhra pradesh",
  "arunachal pradesh",
  "assam",
  "bihar",
  "chhattisgarh",
  "goa",
  "gujarat",
  "haryana",
  "himachal pradesh",
  "jharkhand",
  "karnataka",
  "kerala",
  "madhya pradesh",
  "maharashtra",
  "manipur",
  "meghalaya",
  "mizoram",
  "nagaland",
  "odisha",
  "punjab",
  "rajasthan",
  "sikkim",
  "tamil nadu",
  "telangana",
  "tripura",
  "uttar pradesh",
  "uttarakhand",
  "west bengal",
  "delhi",
  "delhi, ncr",
  "ncr",
  "chandigarh",
  "puducherry",
  "jammu and kashmir",
  "ladakh",
]);

/**
 * Resolves an area label to either a city-wide scope or a neighborhood/local scope.
 * - "Gwalior, Madhya Pradesh" -> City ("Gwalior")
 * - "Gwalior" -> City ("Gwalior")
 * - "Koramangala, Bengaluru" -> Neighborhood ("Koramangala" in "Bengaluru")
 * - "Bandra West, Mumbai" -> Neighborhood ("Bandra West" in "Mumbai")
 * - "Mumbai, Maharashtra" -> City ("Mumbai")
 */
export function resolveLocationScope(areaLabel: string): ResolvedScope {
  const clean = areaLabel.trim();
  if (!clean) {
    return {
      scope: "city",
      label: "City-wide scan",
      cityName: "Selected area",
    };
  }

  const lower = clean.toLowerCase();

  // 1. Direct match in KNOWN_PLACES
  const matched = KNOWN_PLACES.find(
    (p) =>
      p.label.toLowerCase() === lower ||
      p.label.split(",")[0].toLowerCase() === lower ||
      p.id.toLowerCase() === lower,
  );

  if (matched && "type" in matched && (matched.type === "city" || matched.type === "neighborhood")) {
    const cityName = matched.type === "city"
      ? matched.label.split(",")[0].trim()
      : matched.label.split(",")[1]?.trim() ?? matched.label.split(",")[0].trim();
    const neighborhoodName = matched.type === "neighborhood"
      ? matched.label.split(",")[0].trim()
      : undefined;

    return {
      scope: matched.type,
      label: matched.type === "city" ? `City-wide scan · ${cityName}` : `Neighborhood scan · ${neighborhoodName ?? "1.5 km"}`,
      cityName,
      neighborhoodName,
    };
  }

  // 2. Comma-separated parts analysis
  const parts = clean.split(",").map((p) => p.trim());

  if (parts.length >= 2) {
    const firstPart = parts[0];
    const secondPart = parts[1].toLowerCase();

    // If second part is a state / province (e.g. "Gwalior, Madhya Pradesh" or "Pune, Maharashtra")
    if (INDIAN_STATES_AND_UTS.has(secondPart)) {
      return {
        scope: "city",
        label: `City-wide scan · ${firstPart}`,
        cityName: firstPart,
      };
    }

    // If second part is a known city (e.g. "Koramangala, Bengaluru", "Bandra West, Mumbai")
    return {
      scope: "neighborhood",
      label: `Neighborhood scan · ${firstPart}`,
      cityName: parts[1],
      neighborhoodName: firstPart,
    };
  }

  // 3. Single name check
  const singleNameLower = clean.toLowerCase();
  const knownCity = KNOWN_PLACES.find(
    (p) =>
      ("type" in p && p.type === "city") &&
      (p.label.toLowerCase().includes(singleNameLower) ||
        p.id.toLowerCase() === singleNameLower ||
        p.label.split(",")[0].toLowerCase() === singleNameLower),
  );

  if (knownCity) {
    const cityName = knownCity.label.split(",")[0].trim();
    return {
      scope: "city",
      label: `City-wide scan · ${cityName}`,
      cityName,
    };
  }

  // Default fallback: single word without neighborhood signifiers is treated as city
  return {
    scope: "city",
    label: `City-wide scan · ${clean}`,
    cityName: clean,
  };
}
