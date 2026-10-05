/**
 * Gap Signal v0 — deterministic, no LLM.
 *
 * A *signal*, not proof: weighted evidence from Trends (primary demand),
 * review volume (supporting), Maps supply density, and review quality gaps.
 * Pure functions only. Timestamps live in the evidence ledger (built by the
 * route), never inside scoring math.
 */

import {
  type CompetitionInput,
  type GapSignal,
  type GapSignalInput,
  type RatedPlace,
  type TrendSignal,
  type Verdict,
} from "@/types/scan";

// Re-export all domain contracts and schemas so existing consumers remain intact
export * from "@/types/scan";

export const SCORING_WEIGHTS = {
  trend: 0.35,
  reviewSupport: 0.1,
  competition: 0.25,
  qualityGap: 0.3,
} as const;

function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, n));
}

/* ---------------- Trend demand signal (primary) ---------------- */

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

export function computeCompetition(input: CompetitionInput): number {
  const countScore = clamp((input.count / 20) * 100);
  const densityScore = clamp((input.densityPerKm2 / 8) * 100);
  const spreadScore = Number.isFinite(input.medianNearestKm)
    ? clamp(((0.5 - input.medianNearestKm) / 0.5) * 100)
    : 0;
  return Math.round((countScore + densityScore + spreadScore) / 3);
}

/* ---------------- Quality gap ---------------- */

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
