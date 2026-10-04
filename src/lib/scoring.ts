import { z } from "zod";

/**
 * Gap Signal v0 — deterministic, no LLM.
 *
 * A *signal*, not proof: weighted evidence from Trends (primary demand),
 * review volume (supporting), Maps supply density, and review quality gaps.
 * Pure functions only. Timestamps live in the evidence ledger (built by the
 * route), never inside scoring math.
 */

export const SCORING_VERSION = "v0" as const;

export const SCORING_WEIGHTS = {
  trend: 0.35,
  reviewSupport: 0.1,
  competition: 0.25,
  qualityGap: 0.3,
} as const;

export const VERDICTS = ["strong", "moderate", "weak"] as const;
export type Verdict = (typeof VERDICTS)[number];

export const VERDICT_LABEL: Record<Verdict, string> = {
  strong: "Strong signal",
  moderate: "Moderate signal",
  weak: "Weak signal",
};

function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, n));
}

/* ---------------- Trend demand signal (primary) ---------------- */

export interface TrendSignal {
  score: number;
  avgLevel: number;
  slopeScore: number;
  points: number;
}

/** Least-squares slope per timeline step, mapped to 0–100 around 50. */
export function slopeToScore(values: number[]): number {
  if (values.length < 2) return 50;
  const n = values.length;
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i += 1) {
    num += (i - meanX) * (values[i] - meanY);
    den += (i - meanX) * (i - meanX);
  }
  const slope = den === 0 ? 0 : num / den;
  return clamp(Math.round(50 + slope * 25));
}

export function computeTrendSignal(values: number[]): TrendSignal | null {
  if (values.length < 4) return null;
  const avgLevel = values.reduce((a, b) => a + b, 0) / values.length;
  const slopeScore = slopeToScore(values);
  return {
    score: Math.round(avgLevel * 0.6 + slopeScore * 0.4),
    avgLevel: Math.round(avgLevel),
    slopeScore,
    points: values.length,
  };
}

/* ---------------- Review-volume support (secondary) ---------------- */

export function computeReviewSupport(totalReviews: number): number {
  if (totalReviews <= 0) return 0;
  return clamp(Math.round(25 * Math.log10(1 + totalReviews) - 10));
}

/* ---------------- Competition (inverted: higher = more saturated) ---------------- */

export interface CompetitionInput {
  count: number;
  densityPerKm2: number;
  medianNearestKm: number;
}

export function computeCompetition(input: CompetitionInput): number {
  const countScore = clamp((input.count / 20) * 100);
  const densityScore = clamp((input.densityPerKm2 / 8) * 100);
  const spreadScore = Number.isFinite(input.medianNearestKm)
    ? clamp(((0.5 - input.medianNearestKm) / 0.5) * 100)
    : 0;
  return Math.round((countScore + densityScore + spreadScore) / 3);
}

/* ---------------- Quality gap ---------------- */

export interface RatedPlace {
  rating: number;
  reviews: number;
}

export function computeQualityGap(
  places: RatedPlace[],
  complaintMentions: number,
  totalMentions: number,
): number {
  const totalReviews = places.reduce((a, p) => a + p.reviews, 0);
  if (totalReviews <= 0) return 0;
  const lowRatedReviews = places
    .filter((p) => p.rating < 4)
    .reduce((a, p) => a + p.reviews, 0);
  const base = (lowRatedReviews / totalReviews) * 100;
  const boost =
    totalMentions > 0 ? (complaintMentions / totalMentions) * 20 : 0;
  return clamp(Math.round(base + boost));
}

/* ---------------- Gap Signal ---------------- */

export interface GapSignalInput {
  trend: TrendSignal | null;
  reviewSupport: number;
  competition: number;
  qualityGap: number;
}

export interface GapSignal {
  score: number;
  verdict: Verdict;
  /** True when Trends data was missing and weights were redistributed. */
  renormalized: boolean;
}

export function verdictFor(score: number): Verdict {
  if (score >= 75) return "strong";
  if (score >= 50) return "moderate";
  return "weak";
}

export function computeGapSignal(input: GapSignalInput): GapSignal {
  if (input.trend === null) {
    const rest =
      SCORING_WEIGHTS.reviewSupport +
      SCORING_WEIGHTS.competition +
      SCORING_WEIGHTS.qualityGap;
    const score = Math.round(
      (SCORING_WEIGHTS.reviewSupport / rest) * input.reviewSupport +
        (SCORING_WEIGHTS.competition / rest) * (100 - input.competition) +
        (SCORING_WEIGHTS.qualityGap / rest) * input.qualityGap,
    );
    return { score, verdict: verdictFor(score), renormalized: true };
  }
  const score = Math.round(
    SCORING_WEIGHTS.trend * input.trend.score +
      SCORING_WEIGHTS.reviewSupport * input.reviewSupport +
      SCORING_WEIGHTS.competition * (100 - input.competition) +
      SCORING_WEIGHTS.qualityGap * input.qualityGap,
  );
  return { score, verdict: verdictFor(score), renormalized: false };
}

/* ---------------- Scan result shape ---------------- */

export const ledgerEntrySchema = z.object({
  id: z.string(),
  engine: z.enum(["google_maps", "google_maps_reviews", "google_trends"]),
  summary: z.string(),
  resultCount: z.number(),
});
export type LedgerEntry = z.infer<typeof ledgerEntrySchema>;

export const competitorSchema = z.object({
  title: z.string(),
  rating: z.number().optional(),
  reviews: z.number().optional(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  placeType: z.string().optional(),
  selection: z.enum(["anchor", "weak-incumbent", "median"]).optional(),
  evidence: z.string(),
});
export type Competitor = z.infer<typeof competitorSchema>;

export const themeSchema = z.object({
  keyword: z.string(),
  mentions: z.number(),
  sourcePlace: z.string(),
  evidence: z.string(),
});
export type PlaceTheme = z.infer<typeof themeSchema>;

export const trendPointSchema = z.object({
  date: z.string(),
  value: z.number(),
});

export const trendSchema = z.object({
  scopeLabel: z.string(),
  avgLevel: z.number(),
  slopeScore: z.number(),
  score: z.number(),
  points: z.array(trendPointSchema),
  evidence: z.string(),
});

export const insightSchema = z.object({
  text: z.string(),
  evidence: z.array(z.string()),
});
export type Insight = z.infer<typeof insightSchema>;

export const scanScopeSchema = z.object({
  type: z.enum(["city", "neighborhood"]),
  label: z.string(),
  radiusKm: z.number().optional(),
  cityName: z.string().optional(),
});
export type ScanScope = z.infer<typeof scanScopeSchema>;

export const scanResultSchema = z.object({
  mode: z.enum(["mock", "live"]),
  version: z.literal(SCORING_VERSION),
  area: z.object({
    label: z.string(),
    lat: z.number(),
    lng: z.number(),
    scope: z.enum(["city", "neighborhood"]).optional(),
  }),
  scope: scanScopeSchema.optional(),
  category: z.object({ id: z.string(), label: z.string() }),
  gapSignal: z.object({
    score: z.number(),
    verdict: z.enum(VERDICTS),
    renormalized: z.boolean(),
  }),
  components: z.object({
    trend: z.number().nullable(),
    reviewSupport: z.number(),
    competition: z.number(),
    qualityGap: z.number(),
  }),
  stats: z.object({
    places: z.number(),
    totalReviews: z.number(),
    reviewsExamined: z.number(),
  }),
  competitors: z.array(competitorSchema),
  themes: z.array(themeSchema),
  themesWithheld: z.boolean(),
  trend: trendSchema.nullable(),
  insights: z.array(insightSchema),
  ledger: z.array(ledgerEntrySchema),
});
export type ScanResult = z.infer<typeof scanResultSchema>;
