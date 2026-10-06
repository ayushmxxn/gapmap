import { KNOWN_PLACES, INDIAN_STATES_AND_UTS } from "@/lib/places";

export type ScanScopeType = "city" | "neighborhood";

export interface ResolvedScope {
  scope: ScanScopeType;
  label: string;
  cityName: string;
  neighborhoodName?: string;
}

// Decides whether to scan a wide metro area (city) or a 1.5 km radius (neighborhood).
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

  const parts = clean.split(",").map((p) => p.trim());

  if (parts.length >= 2) {
    const firstPart = parts[0];
    const secondPart = parts[1].toLowerCase();

    // Matching a state indicates a city-level query like "Gwalior, Madhya Pradesh".
    if (INDIAN_STATES_AND_UTS.has(secondPart)) {
      return {
        scope: "city",
        label: `City-wide scan · ${firstPart}`,
        cityName: firstPart,
      };
    }

    // Matching a city name indicates a neighborhood query like "Koramangala, Bengaluru".
    return {
      scope: "neighborhood",
      label: `Neighborhood scan · ${firstPart}`,
      cityName: parts[1],
      neighborhoodName: firstPart,
    };
  }

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

  // Default to city-wide when ambiguous so we don't prematurely constrain the scan area.
  return {
    scope: "city",
    label: `City-wide scan · ${clean}`,
    cityName: clean,
  };
}
