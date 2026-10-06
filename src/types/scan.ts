import { z } from "zod";

export const SCORING_VERSION = "v0" as const;

export const VERDICTS = ["strong", "moderate", "weak"] as const;
export type Verdict = (typeof VERDICTS)[number];

export const VERDICT_LABEL: Record<Verdict, string> = {
  strong: "Strong signal",
  moderate: "Moderate signal",
  weak: "Weak signal",
};



export interface TrendSignal {
  score: number;
  avgLevel: number;
  slopeScore: number;
  points: number;
}

export interface CompetitionInput {
  count: number;
  densityPerKm2: number;
  medianNearestKm: number;
}

export interface RatedPlace {
  rating: number;
  reviews: number;
}

export interface GapSignalInput {
  trend: TrendSignal | null;
  reviewSupport: number;
  competition: number;
  qualityGap: number;
}

export interface GapSignal {
  score: number;
  verdict: Verdict;
  // True when Trends data was missing and scoring weights were redistributed.
  renormalized: boolean;
}



export const scanRequestSchema = z.object({
  lat: z
    .number()
    .finite("Latitude must be a valid number")
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  lng: z
    .number()
    .finite("Longitude must be a valid number")
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
  categoryId: z
    .string()
    .trim()
    .min(1, "Category cannot be empty")
    .max(50, "Category exceeds maximum length")
    .regex(/^[a-zA-Z0-9\s\-_'&.]+$/, "Category contains invalid characters"),
  areaLabel: z
    .string()
    .trim()
    .min(1, "Location label cannot be empty")
    .max(150, "Location label exceeds maximum length"),
  scope: z.enum(["city", "neighborhood"]).optional(),
});
export type ScanInput = z.infer<typeof scanRequestSchema>;

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
export type TrendPoint = z.infer<typeof trendPointSchema>;

export const trendSchema = z.object({
  scopeLabel: z.string(),
  avgLevel: z.number(),
  slopeScore: z.number(),
  score: z.number(),
  points: z.array(trendPointSchema),
  evidence: z.string(),
});
export type TrendData = z.infer<typeof trendSchema>;

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
