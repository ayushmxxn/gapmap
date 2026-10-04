import { NextResponse } from "next/server";
import { z } from "zod";
import {
  fetchMapsPlaces,
  fetchPlaceReviews,
  fetchTrends,
  SerpApiError,
  type MapsPlace,
} from "@/lib/serpapi";
import { resolveCategory } from "@/lib/categories";
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
} from "@/lib/scoring";
import { generateMockScanResult } from "@/lib/mock";
import { resolveLocationScope } from "@/lib/location-scope";
import { serverEnv } from "@/lib/env";

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

const inputSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  categoryId: z.string().min(1).max(40),
  areaLabel: z.string().min(1).max(120),
  scope: z.enum(["city", "neighborhood"]).optional(),
});

const hitsByIp = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  const now = Date.now();
  const windowStart = now - 60 * 60 * 1000;
  const hits = (hitsByIp.get(ip) ?? []).filter((t) => t > windowStart);
  if (hits.length >= 10) return true;
  hits.push(now);
  hitsByIp.set(ip, hits);
  return false;
}

function placeKey(p: MapsPlace): string {
  return p.data_id ?? p.place_id ?? `${p.title}-${p.gps_coordinates?.latitude ?? ""}-${p.gps_coordinates?.longitude ?? ""}`;
}

interface ReviewTarget {
  place: MapsPlace;
  role: "anchor" | "weak-incumbent" | "median";
}

export function selectReviewTargets(places: MapsPlace[]): ReviewTarget[] {
  const withIds = places.filter((p) => p.data_id);
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
    .filter((p) => p.rating != null && (p.reviews ?? 0) >= MIN_REVIEWS_FOR_WEAK_PICK)
    .sort((a, b) => (a.rating ?? 5) - (b.rating ?? 5));
  for (const p of weak) {
    if ([...picked.values()].filter((t) => t.role === "weak-incumbent").length >= 2) break;
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

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Scan limit reached. Try again later." },
      { status: 429 },
    );
  }

  const parsedInput = inputSchema.safeParse(await req.json().catch(() => null));
  if (!parsedInput.success) {
    return NextResponse.json({ error: "Invalid scan input." }, { status: 400 });
  }
  const { lat, lng, categoryId, areaLabel } = parsedInput.data;
  const category = resolveCategory(categoryId);

  // Resolve scope: City-wide scan vs Neighborhood/local scan
  const resolvedScope = resolveLocationScope(areaLabel);
  const scopeType = parsedInput.data.scope ?? resolvedScope.scope;
  const isCity = scopeType === "city";
  const cityName = resolvedScope.cityName;

  const hasKey = serverEnv.SERPAPI_KEY.length > 0;
  if (!hasKey || serverEnv.NEXT_PUBLIC_USE_MOCK) {
    // Mock mode: generate full realistic dataset matching the scope
    const mock = generateMockScanResult({
      lat,
      lng,
      categoryId: category.id,
      categoryLabel: category.label,
      areaLabel,
      scope: scopeType,
    });
    return NextResponse.json(scanResultSchema.parse(mock));
  }

  try {
    const ledger: LedgerEntry[] = [];
    let geoPlaces: (MapsPlace & { lat: number; lng: number })[] = [];
    let effectiveRadiusKm = SCAN_RADIUS_KM;

    if (isCity) {
      // City-wide scan: Query across the city with pagination to collect sufficient results
      const cityQuery = `${category.mapsQuery} in ${cityName}`;
      const ll = `@${lat},${lng},${CITY_SCAN_ZOOM}z`;

      // Page 1
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

      // Page 2 (if page 1 had full results, fetch page 2 to cover more commercial clusters)
      let page2Places: MapsPlace[] = [];
      if (page1Places.length >= 10) {
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
        } catch {
          /* Page 2 optional; continue with page 1 */
        }
      }

      // Deduplicate across pages
      const seenKeys = new Set<string>();
      const combinedPlaces: MapsPlace[] = [];
      for (const p of [...page1Places, ...page2Places]) {
        const k = placeKey(p);
        if (!seenKeys.has(k)) {
          seenKeys.add(k);
          combinedPlaces.push(p);
        }
      }

      // Filter to places within city bounds (do NOT use 1.5km center restriction)
      geoPlaces = filterWithinCity(
        combinedPlaces
          .filter((p) => p.gps_coordinates)
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
      // Neighborhood scan: focused 1.5 km radius around center
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
          .filter((p) => p.gps_coordinates)
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

    const targets = selectReviewTargets(geoPlaces);
    const reviewsByTarget = await Promise.all(
      targets.map(async (t, i) => {
        const id = `reviews-${i + 1}`;
        const data = await fetchPlaceReviews(t.place.data_id as string);
        ledger.push({
          id,
          engine: "google_maps_reviews",
          summary: `${t.place.title} (${t.role})`,
          resultCount: data.reviews.length,
        });
        return { target: t, ledgerId: id, data };
      }),
    );

    const trendQueries = [category.trendsQuery, ...category.siblings].slice(0, 5);
    const timeline = await fetchTrends({
      q: trendQueries.join(","),
      geo: TREND_GEO,
      date: TREND_DATE,
    });
    const trendsId = `trends-${reviewsByTarget.length + 1}`;
    ledger.push({
      id: trendsId,
      engine: "google_trends",
      summary: `q=${trendQueries.join(",")} geo=${TREND_GEO} ${TREND_DATE}`,
      resultCount: timeline.length,
    });

    /* ---- Competitors ---- */
    const targetRole = new Map(
      reviewsByTarget.map((r) => [placeKey(r.target.place), r.target.role]),
    );
    const competitors: Competitor[] = geoPlaces.map((p) => ({
      title: p.title,
      rating: p.rating,
      reviews: p.reviews,
      address: p.address,
      lat: p.lat,
      lng: p.lng,
      placeType: p.type,
      selection: targetRole.get(placeKey(p)),
      evidence: "maps-1",
    }));

    /* ---- Themes (gated) ---- */
    const reviewsExamined = reviewsByTarget.reduce(
      (a, r) => a + r.data.reviews.length,
      0,
    );
    let themes: PlaceTheme[] = [];
    let themesWithheld = reviewsExamined < MIN_REVIEWS_EXAMINED_FOR_THEMES;
    if (!themesWithheld) {
      for (const r of reviewsByTarget) {
        for (const t of r.data.topics) {
          if (t.mentions >= MIN_MENTIONS_FOR_THEME) {
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

    /* ---- Components ---- */
    const targetName = trendQueries[0].toLowerCase();
    const targetValues = timeline
      .map((pt) => pt.values.find((v) => v.query.toLowerCase() === targetName))
      .filter((v) => v !== undefined)
      .map((v) => v.extracted_value);
    const trendSignal = computeTrendSignal(targetValues);
    const trendScopeLabel =
      "Google Trends · India, national · past 12 months";

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

    /* ---- Insights (every claim carries ledger refs) ---- */
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

    const scopeLabel = isCity
      ? `City-wide scan · ${cityName}`
      : `Neighborhood scan · 1.5 km`;

    const result: ScanResult = {
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
              .filter((x) => x !== null),
            evidence: trendsId,
          }
        : null,
      insights,
      ledger,
    };

    return NextResponse.json(scanResultSchema.parse(result));
  } catch (err) {
    if (err instanceof SerpApiError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    return NextResponse.json({ error: "Scan failed." }, { status: 500 });
  }
}
