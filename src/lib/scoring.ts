// Deterministic scoring engine combining Trends, review volume, supply density, and quality gaps.

import {
  type CompetitionInput,
  type GapSignal,
  type GapSignalInput,
  type RatedPlace,
  type TrendSignal,
  type Verdict,
} from "@/types/scan";

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

// Map the timeline slope to 0-100 where 50 represents flat growth.
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
  // Need at least 4 timeline data points to measure a reliable trajectory.
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

export function computeReviewSupport(totalReviews: number): number {
  if (totalReviews <= 0) return 0;
  // Logarithmic scaling prevents high-volume chains from dominating the review score.
  return clamp(Math.round(25 * Math.log10(1 + totalReviews) - 10));
}

export function computeCompetition(input: CompetitionInput): number {
  const countScore = clamp((input.count / 20) * 100);
  const densityScore = clamp((input.densityPerKm2 / 8) * 100);
  // Benchmark against a 500m walking radius between adjacent competitors.
  const spreadScore = Number.isFinite(input.medianNearestKm)
    ? clamp(((0.5 - input.medianNearestKm) / 0.5) * 100)
    : 0;
  return Math.round((countScore + densityScore + spreadScore) / 3);
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
  // Boost the opportunity score when existing reviews frequently mention complaints.
  const boost =
    totalMentions > 0 ? (complaintMentions / totalMentions) * 20 : 0;
  return clamp(Math.round(base + boost));
}

export function verdictFor(score: number): Verdict {
  if (score >= 75) return "strong";
  if (score >= 50) return "moderate";
  return "weak";
}

export function computeGapSignal(input: GapSignalInput): GapSignal {
  // Renormalize remaining weights so missing Trends data doesn't artificially depress the score.
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
  // Invert competition so high market saturation lowers the opportunity score.
  const score = Math.round(
    SCORING_WEIGHTS.trend * input.trend.score +
      SCORING_WEIGHTS.reviewSupport * input.reviewSupport +
      SCORING_WEIGHTS.competition * (100 - input.competition) +
      SCORING_WEIGHTS.qualityGap * input.qualityGap,
  );
  return { score, verdict: verdictFor(score), renormalized: false };
}
