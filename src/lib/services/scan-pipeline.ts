import {
  fetchMapsPlaces,
  fetchPlaceReviews,
  fetchTrends,
  logSafeError,
  type MapsPlace,
  type TrendsTimelinePoint,
} from "@/lib/serpapi";
import { resolveCategory } from "@/lib/categories";
import { isRelevantTheme } from "@/lib/theme-filter";
import {
  SCAN_RADIUS_KM,
  CITY_DEFAULT_METRO_RADIUS_KM,
  densityPerKm2,
  effectiveSpreadRadiusKm,
  filterWithinCity,
  filterWithinRadius,
  medianNearestNeighborKm,
} from "@/lib/geo";
import {
  computeCompetition,
  computeGapSignal,
  computeQualityGap,
  computeReviewSupport,
  computeTrendSignal,
  scanResultSchema,
  verdictFor,
  type Competitor,
  type Insight,
  type LedgerEntry,
  type PlaceTheme,
  type ScanResult,
  type ScanInput,
} from "@/lib/scoring";
import { generateMockScanResult } from "@/lib/mock";
import { resolveLocationScope } from "@/lib/location-scope";
import { serverEnv } from "@/lib/env";
import {
  clearInFlightScan,
  getCachedScan,
  getInFlightScan,
  getScanCacheKey,
  setCachedScan,
  setInFlightScan,
} from "@/lib/scan-cache";

const MAX_REVIEW_TARGETS = 5;
const MIN_REVIEWS_FOR_WEAK_PICK = 10;
const MIN_MENTIONS_FOR_THEME = 3;
const MIN_REVIEWS_EXAMINED_FOR_THEMES = 20;
const TREND_GEO = "IN";
const TREND_DATE = "today 12-m";
const NEIGHBORHOOD_SCAN_ZOOM = 15;
const CITY_SCAN_ZOOM = 12;

const COMPLAINT_HINTS = [
  "service",
  "wait",
  "price",
  "expensive",
  "slow",
  "rude",
  "hygiene",
  "clean",
  "crowd",
  "parking",
];

export type ScanPipelineInput = ScanInput;

function placeKey(p: MapsPlace): string {
  return (
    p.data_id ??
    p.place_id ??
    `${p.title}-${p.gps_coordinates?.latitude ?? ""}-${p.gps_coordinates?.longitude ?? ""}`
  );
}

interface ReviewTarget {
  place: MapsPlace;
  role: "anchor" | "weak-incumbent" | "median";
}

// Pick a mix of high-volume anchors and low-rated places to uncover both traffic drivers and customer complaints.
export function selectReviewTargets(places: MapsPlace[]): ReviewTarget[] {
  const withIds = places.filter((p) => Boolean(p.data_id));
  const picked = new Map<string, ReviewTarget>();
  const take = (p: MapsPlace, role: ReviewTarget["role"]) => {
    if (picked.size >= MAX_REVIEW_TARGETS) return;
    const key = placeKey(p);
    if (!picked.has(key)) picked.set(key, { place: p, role });
  };

  const byVolume = [...withIds].sort(
    (a, b) => (b.reviews ?? 0) - (a.reviews ?? 0),
  );
  for (const p of byVolume) {
    if (picked.size >= 2) break;
    if ((p.reviews ?? 0) > 0) take(p, "anchor");
  }

  const weak = withIds
    .filter(
      (p) =>
        p.rating != null && (p.reviews ?? 0) >= MIN_REVIEWS_FOR_WEAK_PICK,
    )
    .sort((a, b) => (a.rating ?? 5) - (b.rating ?? 5));
  for (const p of weak) {
    if (
      [...picked.values()].filter((t) => t.role === "weak-incumbent").length >= 2
    )
      break;
    take(p, "weak-incumbent");
  }

  const rated = [...withIds]
    .filter((p) => p.rating != null)
    .sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));
  if (rated.length > 0) {
    take(rated[Math.floor(rated.length / 2)], "median");
  }

  for (const p of byVolume) {
    if (picked.size >= MAX_REVIEW_TARGETS) break;
    take(p, "anchor");
  }
  return [...picked.values()];
}

// Orchestrates scope resolution, caching, external fetching, and deterministic score synthesis.
export async function executeScanPipeline(
  input: ScanPipelineInput,
): Promise<ScanResult> {
  const { lat, lng, categoryId, areaLabel } = input;
  const category = resolveCategory(categoryId);

  const resolvedScope = resolveLocationScope(areaLabel);
  const scopeType = input.scope ?? resolvedScope.scope;
  const isCity = scopeType === "city";
  const cityName = resolvedScope.cityName;

  const hasKey = (serverEnv.SERPAPI_KEY ?? "").trim().length > 0;
  if (!hasKey || serverEnv.NEXT_PUBLIC_USE_MOCK) {
    const mock = generateMockScanResult({
      lat,
      lng,
      categoryId: category.id,
      categoryLabel: category.label,
      areaLabel,
      scope: scopeType,
    });
    return scanResultSchema.parse(mock);
  }

  const scanKey = getScanCacheKey({
    lat,
    lng,
    categoryId: category.id,
    scope: scopeType,
    cityName: isCity ? cityName : undefined,
  });

  const cachedResult = getCachedScan(scanKey);
  if (cachedResult) {
    return cachedResult;
  }

  const inFlight = getInFlightScan(scanKey);
  if (inFlight) {
    try {
      return await inFlight;
    } catch {
      // Fall through on error to attempt a fresh execution.
    }
  }

  const executionPromise = (async (): Promise<ScanResult> => {
    const ledger: LedgerEntry[] = [];
    let geoPlaces: (MapsPlace & { lat: number; lng: number })[] = [];
    let effectiveRadiusKm = SCAN_RADIUS_KM;

    // Fetch Trends in parallel with Maps so timeline data is ready when places finish downloading.
    const trendQueries = [category.trendsQuery, ...category.siblings].slice(0, 5);
    const trendsPromise = fetchTrends({
      q: trendQueries.join(","),
      geo: TREND_GEO,
      date: TREND_DATE,
    }).catch((err) => {
      logSafeError("Trends fetch failed; proceeding with renormalized weights", err);
      return null;
    });

    if (isCity) {
      const cityQuery = `${category.mapsQuery} in ${cityName}`;
      const ll = `@${lat},${lng},${CITY_SCAN_ZOOM}z`;

      const page1Places = await fetchMapsPlaces({
        q: cityQuery,
        ll,
        start: 0,
      });

      ledger.push({
        id: "maps-1",
        engine: "google_maps",
        summary: `q="${cityQuery}" city-wide (page 1)`,
        resultCount: page1Places.length,
      });

      // Only fetch page 2 if page 1 maxed out at 20 results.
      let page2Places: MapsPlace[] = [];
      if (page1Places.length >= 20) {
        try {
          page2Places = await fetchMapsPlaces({
            q: cityQuery,
            ll,
            start: 20,
          });
          if (page2Places.length > 0) {
            ledger.push({
              id: "maps-2",
              engine: "google_maps",
              summary: `q="${cityQuery}" city-wide (page 2)`,
              resultCount: page2Places.length,
            });
          }
        } catch (err) {
          logSafeError("City page 2 fetch omitted", err);
        }
      }

      const seenKeys = new Set<string>();
      const combinedPlaces: MapsPlace[] = [];
      for (const p of [...page1Places, ...page2Places]) {
        const k = placeKey(p);
        if (!seenKeys.has(k)) {
          seenKeys.add(k);
          combinedPlaces.push(p);
        }
      }

      geoPlaces = filterWithinCity(
        combinedPlaces
          .filter((p) => Boolean(p.gps_coordinates))
          .map((p) => ({
            ...p,
            lat: p.gps_coordinates?.latitude ?? Number.NaN,
            lng: p.gps_coordinates?.longitude ?? Number.NaN,
          })),
        { lat, lng },
        cityName,
        CITY_DEFAULT_METRO_RADIUS_KM,
      );

      effectiveRadiusKm = effectiveSpreadRadiusKm(geoPlaces, { lat, lng });
    } else {
      const neighborhoodQuery = `${category.mapsQuery} in ${areaLabel}`;
      const ll = `@${lat},${lng},${NEIGHBORHOOD_SCAN_ZOOM}z`;

      const mapsPlaces = await fetchMapsPlaces({
        q: neighborhoodQuery,
        ll,
        start: 0,
      });

      ledger.push({
        id: "maps-1",
        engine: "google_maps",
        summary: `q="${neighborhoodQuery}" ${ll}`,
        resultCount: mapsPlaces.length,
      });

      geoPlaces = filterWithinRadius(
        mapsPlaces
          .filter((p) => Boolean(p.gps_coordinates))
          .map((p) => ({
            ...p,
            lat: p.gps_coordinates?.latitude ?? Number.NaN,
            lng: p.gps_coordinates?.longitude ?? Number.NaN,
          })),
        { lat, lng },
        SCAN_RADIUS_KM,
      );
      effectiveRadiusKm = SCAN_RADIUS_KM;
    }

    // Fetch reviews concurrently without failing the entire scan if one establishment errors.
    const targets = selectReviewTargets(geoPlaces);
    const reviewsByTarget = (
      await Promise.all(
        targets.map(async (t, i) => {
          const id = `reviews-${i + 1}`;
          try {
            const data = await fetchPlaceReviews(t.place.data_id as string);
            ledger.push({
              id,
              engine: "google_maps_reviews",
              summary: `${t.place.title} (${t.role})`,
              resultCount: data.reviews.length,
            });
            return { target: t, ledgerId: id, data };
          } catch (err) {
            logSafeError(`Failed to fetch reviews for ${t.place.title}`, err);
            return null;
          }
        }),
      )
    ).filter((r): r is NonNullable<typeof r> => r !== null);

    const trendsTimeline = await trendsPromise;
    const trendsId = `trends-${reviewsByTarget.length + 1}`;
    let timeline: TrendsTimelinePoint[] = [];

    if (trendsTimeline && trendsTimeline.length > 0) {
      timeline = trendsTimeline;
      ledger.push({
        id: trendsId,
        engine: "google_trends",
        summary: `q=${trendQueries.join(",")} geo=${TREND_GEO} ${TREND_DATE}`,
        resultCount: timeline.length,
      });
    } else {
      ledger.push({
        id: trendsId,
        engine: "google_trends",
        summary: `q=${trendQueries.join(",")} (unavailable, weights renormalized)`,
        resultCount: 0,
      });
    }

    const targetRole = new Map(
      reviewsByTarget.map((r) => [placeKey(r.target.place), r.target.role]),
    );
    const competitors: Competitor[] = geoPlaces.map((p) => ({
      title: p.title,
      placeId: p.place_id ?? p.data_id,
      rating: p.rating,
      reviews: p.reviews,
      address: p.address,
      lat: p.lat,
      lng: p.lng,
      placeType: p.type,
      selection: targetRole.get(placeKey(p)),
      evidence: "maps-1",
    }));

    const reviewsExamined = reviewsByTarget.reduce(
      (a, r) => a + r.data.reviews.length,
      0,
    );
    let themes: PlaceTheme[] = [];
    // Require enough total reviews before surfacing themes to avoid showing misleading single-review topics.
    let themesWithheld = reviewsExamined < MIN_REVIEWS_EXAMINED_FOR_THEMES;
    if (!themesWithheld) {
      for (const r of reviewsByTarget) {
        for (const t of r.data.topics) {
          if (
            t.mentions >= MIN_MENTIONS_FOR_THEME &&
            isRelevantTheme(t.keyword, category)
          ) {
            themes.push({
              keyword: t.keyword,
              mentions: t.mentions,
              sourcePlace: r.target.place.title,
              evidence: r.ledgerId,
            });
          }
        }
      }
      themes.sort((a, b) => b.mentions - a.mentions);
      themes = themes.slice(0, 8);
      if (themes.length === 0) themesWithheld = true;
    }

    const targetName = trendQueries[0].toLowerCase();
    const targetValues = timeline
      .map((pt) => pt.values.find((v) => v.query.toLowerCase() === targetName))
      .filter((v): v is NonNullable<typeof v> => v !== undefined)
      .map((v) => v.extracted_value);

    const trendSignal = computeTrendSignal(targetValues);
    const trendScopeLabel = "Google Trends · India, national · past 12 months";

    const totalReviews = geoPlaces.reduce((a, p) => a + (p.reviews ?? 0), 0);
    const reviewSupport = computeReviewSupport(totalReviews);

    const geoPoints = geoPlaces.map((p) => ({ lat: p.lat, lng: p.lng }));
    const competition = computeCompetition({
      count: geoPlaces.length,
      densityPerKm2: densityPerKm2(geoPlaces.length, effectiveRadiusKm),
      medianNearestKm: medianNearestNeighborKm(geoPoints),
    });

    const rated = geoPlaces
      .filter((p) => p.rating != null)
      .map((p) => ({ rating: p.rating as number, reviews: p.reviews ?? 0 }));

    const allMentions = themes.reduce((a, t) => a + t.mentions, 0);
    const complaintMentions = themes
      .filter((t) =>
        COMPLAINT_HINTS.some((h) => t.keyword.toLowerCase().includes(h)),
      )
      .reduce((a, t) => a + t.mentions, 0);

    const qualityGap = computeQualityGap(rated, complaintMentions, allMentions);

    const gap = computeGapSignal({
      trend: trendSignal,
      reviewSupport,
      competition,
      qualityGap,
    });

    const insights: Insight[] = [];
    if (trendSignal) {
      const dir =
        trendSignal.slopeScore > 55
          ? "rising"
          : trendSignal.slopeScore < 45
            ? "softening"
            : "steady";
      insights.push({
        text: `Search interest for ${category.label.toLowerCase()}s in India averages ${trendSignal.avgLevel}/100 and is ${dir}.`,
        evidence: [trendsId],
      });
    } else {
      insights.push({
        text: "No trend data was returned — this signal uses Maps and review evidence only.",
        evidence: [trendsId],
      });
    }

    if (geoPlaces.length === 0) {
      insights.push({
        text: `No active ${category.label.toLowerCase()} businesses found within this ${isCity ? "city" : "neighborhood"} — indicates an open market or early-stage commercial area.`,
        evidence: ["maps-1"],
      });
    } else {
      const weakPlaces = rated.filter((p) => p.rating < 4);
      const weakReviews = weakPlaces.reduce((a, p) => a + p.reviews, 0);
      if (weakPlaces.length > 0) {
        const weakIds = reviewsByTarget
          .filter((r) => r.target.role === "weak-incumbent")
          .map((r) => r.ledgerId);
        insights.push({
          text: `${weakPlaces.length} of ${rated.length} rated places score below 4.0, holding ${weakReviews.toLocaleString("en-IN")} reviews — footfall exists, satisfaction lags.`,
          evidence: ["maps-1", ...weakIds],
        });
      } else if (rated.length > 0) {
        insights.push({
          text: "Every rated place holds 4.0 or more — incumbents look strong on quality.",
          evidence: ["maps-1"],
        });
      }

      if (totalReviews < 10) {
        insights.push({
          text: "Low total review volume recorded — market signal relies primarily on geographic supply spread.",
          evidence: ["maps-1"],
        });
      }

      if (!themesWithheld && themes.length > 0) {
        const top = themes.slice(0, 2);
        insights.push({
          text: `Recurring review themes: ${top.map((t) => `${t.keyword} (${t.mentions}, ${t.sourcePlace})`).join("; ")}.`,
          evidence: [...new Set(top.map((t) => t.evidence))],
        });
      }

      if (isCity) {
        insights.push({
          text: `${geoPlaces.length} places identified across ${cityName} city-wide.`,
          evidence: ["maps-1"],
        });
      } else {
        insights.push({
          text: `${geoPlaces.length} places within ${SCAN_RADIUS_KM} km (${densityPerKm2(geoPlaces.length, SCAN_RADIUS_KM).toFixed(1)}/km²).`,
          evidence: ["maps-1"],
        });
      }
    }

    const scopeLabel = isCity
      ? `City-wide scan · ${cityName}`
      : `Neighborhood scan · 1.5 km`;

    const scanResult: ScanResult = {
      mode: "live",
      version: "v0",
      area: { label: areaLabel, lat, lng, scope: scopeType },
      scope: {
        type: scopeType,
        label: scopeLabel,
        cityName: isCity ? cityName : undefined,
        radiusKm: isCity ? undefined : SCAN_RADIUS_KM,
      },
      category: { id: category.id, label: category.label },
      gapSignal: {
        score: gap.score,
        verdict: verdictFor(gap.score),
        renormalized: gap.renormalized,
      },
      components: {
        trend: trendSignal?.score ?? null,
        reviewSupport,
        competition,
        qualityGap,
      },
      stats: {
        places: geoPlaces.length,
        totalReviews,
        reviewsExamined,
      },
      competitors,
      themes,
      themesWithheld,
      trend: trendSignal
        ? {
            scopeLabel: trendScopeLabel,
            avgLevel: trendSignal.avgLevel,
            slopeScore: trendSignal.slopeScore,
            score: trendSignal.score,
            points: timeline
              .map((pt) => {
                const v = pt.values.find(
                  (x) => x.query.toLowerCase() === targetName,
                );
                return v ? { date: pt.date, value: v.extracted_value } : null;
              })
              .filter((x): x is NonNullable<typeof x> => x !== null),
            evidence: trendsId,
          }
        : null,
      insights,
      ledger,
    };

    const validated = scanResultSchema.parse(scanResult);
    setCachedScan(scanKey, validated);
    return validated;
  })();

  setInFlightScan(scanKey, executionPromise);

  try {
    return await executionPromise;
  } finally {
    clearInFlightScan(scanKey);
  }
}
