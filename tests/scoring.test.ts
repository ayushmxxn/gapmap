import { describe, expect, it } from "vitest";
import {
  computeCompetition,
  computeGapSignal,
  computeQualityGap,
  computeReviewSupport,
  computeTrendSignal,
  slopeToScore,
  verdictFor,
} from "@/lib/scoring";
import type { RatedPlace } from "@/types/scan";

describe("Scoring Engine: Trend Scoring", () => {
  it("slopeToScore: returns neutral 50 for fewer than 2 points", () => {
    expect(slopeToScore([])).toBe(50);
    expect(slopeToScore([45])).toBe(50);
  });

  it("slopeToScore: computes flat line as 50", () => {
    expect(slopeToScore([40, 40, 40, 40])).toBe(50);
  });

  it("slopeToScore: scores upward trend above 50 and clamps to 100", () => {
    const rising = slopeToScore([10, 30, 50, 70, 90]);
    expect(rising).toBeGreaterThan(50);

    const steepRising = slopeToScore([0, 25, 50, 75, 100]);
    expect(steepRising).toBeLessThanOrEqual(100);
  });

  it("slopeToScore: scores downward trend below 50 and clamps to 0", () => {
    const falling = slopeToScore([90, 70, 50, 30, 10]);
    expect(falling).toBeLessThan(50);

    const steepFalling = slopeToScore([100, 75, 50, 25, 0]);
    expect(steepFalling).toBeGreaterThanOrEqual(0);
  });

  it("computeTrendSignal: returns null for fewer than 4 points", () => {
    expect(computeTrendSignal([50, 60, 70])).toBeNull();
    expect(computeTrendSignal([])).toBeNull();
  });

  it("computeTrendSignal: computes weighted average of level and slope", () => {
    const points = [40, 50, 60, 70];
    const signal = computeTrendSignal(points);
    expect(signal).not.toBeNull();
    expect(signal?.points).toBe(4);
    expect(signal?.avgLevel).toBe(55);
    expect(signal?.slopeScore).toBeGreaterThan(50);
    // score = round(55 * 0.6 + slopeScore * 0.4)
    expect(signal?.score).toBe(
      Math.round(55 * 0.6 + (signal?.slopeScore ?? 0) * 0.4),
    );
  });
});

describe("Scoring Engine: Competition Scoring", () => {
  it("zero competitors: returns 0 competition score", () => {
    const score = computeCompetition({
      count: 0,
      densityPerKm2: 0,
      medianNearestKm: Number.POSITIVE_INFINITY,
    });
    expect(score).toBe(0);
  });

  it("moderate competitors: calculates balanced average of count, density, and spread", () => {
    const score = computeCompetition({
      count: 10, // (10 / 20) * 100 = 50
      densityPerKm2: 4, // (4 / 8) * 100 = 50
      medianNearestKm: 0.25, // ((0.5 - 0.25) / 0.5) * 100 = 50
    });
    // (50 + 50 + 50) / 3 = 50
    expect(score).toBe(50);
  });

  it("boundary values: clamps high saturation to 100", () => {
    const score = computeCompetition({
      count: 50, // capped at 100
      densityPerKm2: 25, // capped at 100
      medianNearestKm: 0, // maximally packed, capped at 100
    });
    expect(score).toBe(100);
  });

  it("boundary values: clamps widely spaced places to 0 spread score", () => {
    const score = computeCompetition({
      count: 1, // 5
      densityPerKm2: 0.1, // 1.25
      medianNearestKm: 2.5, // > 0.5km, clamped to 0
    });
    expect(score).toBeLessThanOrEqual(5);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

describe("Scoring Engine: Quality-Gap Scoring", () => {
  it("zero reviews across places returns 0", () => {
    const places: RatedPlace[] = [
      { rating: 3.2, reviews: 0 },
      { rating: 4.8, reviews: 0 },
    ];
    expect(computeQualityGap(places, 0, 0)).toBe(0);
  });

  it("empty places array returns 0", () => {
    expect(computeQualityGap([], 5, 10)).toBe(0);
  });

  it("all high-rated places (>=4.0) with zero complaints returns 0", () => {
    const places: RatedPlace[] = [
      { rating: 4.5, reviews: 100 },
      { rating: 4.2, reviews: 200 },
    ];
    expect(computeQualityGap(places, 0, 10)).toBe(0);
  });

  it("all low-rated places (<4.0) gives 100% base quality gap", () => {
    const places: RatedPlace[] = [
      { rating: 3.2, reviews: 100 },
      { rating: 3.5, reviews: 150 },
    ];
    // base = 100, boost = 0
    expect(computeQualityGap(places, 0, 0)).toBe(100);
  });

  it("identical review counts with mixed ratings calculates exact proportion", () => {
    const places: RatedPlace[] = [
      { rating: 3.5, reviews: 100 }, // low rated
      { rating: 4.5, reviews: 100 }, // high rated
    ];
    // 100 low / 200 total = 50%
    expect(computeQualityGap(places, 0, 0)).toBe(50);
  });

  it("complaint mentions boost the quality gap score", () => {
    const places: RatedPlace[] = [
      { rating: 3.5, reviews: 100 },
      { rating: 4.5, reviews: 100 },
    ];
    // base = 50%, complaint boost = (10 / 20) * 20 = 10% -> 60%
    const score = computeQualityGap(places, 10, 20);
    expect(score).toBe(60);
  });

  it("clamps quality gap to a maximum of 100", () => {
    const places: RatedPlace[] = [{ rating: 2.5, reviews: 500 }];
    // base = 100, boost = 20 -> clamped to 100
    expect(computeQualityGap(places, 50, 50)).toBe(100);
  });
});

describe("Scoring Engine: Review Support Support Function", () => {
  it("returns 0 for zero or negative reviews", () => {
    expect(computeReviewSupport(0)).toBe(0);
    expect(computeReviewSupport(-10)).toBe(0);
  });

  it("scales logarithmically with review volume", () => {
    const small = computeReviewSupport(10);
    const large = computeReviewSupport(1000);
    expect(large).toBeGreaterThan(small);
    expect(large).toBeLessThanOrEqual(100);
  });
});

describe("Scoring Engine: Verdict Classifications", () => {
  it("classifies scores into correct verdict bands", () => {
    expect(verdictFor(100)).toBe("strong");
    expect(verdictFor(75)).toBe("strong");
    expect(verdictFor(74)).toBe("moderate");
    expect(verdictFor(50)).toBe("moderate");
    expect(verdictFor(49)).toBe("weak");
    expect(verdictFor(0)).toBe("weak");
  });
});

describe("Scoring Engine: Final Gap Signal Calculation", () => {
  it("computes full 4-component Gap Signal when Trends data is present", () => {
    const result = computeGapSignal({
      trend: { score: 80, avgLevel: 80, slopeScore: 80, points: 12 },
      reviewSupport: 60,
      competition: 40, // (100 - 40) = 60 opportunity
      qualityGap: 70,
    });

    // 0.35 * 80 (28) + 0.1 * 60 (6) + 0.25 * 60 (15) + 0.3 * 70 (21) = 70
    expect(result.score).toBe(70);
    expect(result.verdict).toBe("moderate");
    expect(result.renormalized).toBe(false);
  });

  it("missing Trends data triggers weight renormalization across remaining 3 factors", () => {
    const result = computeGapSignal({
      trend: null,
      reviewSupport: 50,
      competition: 50, // (100 - 50) = 50
      qualityGap: 50,
    });

    // When all inputs are 50, normalized weighted sum must still be exactly 50
    expect(result.score).toBe(50);
    expect(result.verdict).toBe("moderate");
    expect(result.renormalized).toBe(true);
  });

  it("handles zero competitors scenario gracefully", () => {
    const result = computeGapSignal({
      trend: { score: 90, avgLevel: 90, slopeScore: 90, points: 10 },
      reviewSupport: 0,
      competition: 0, // competition 0 -> (100 - 0) = 100 supply gap opportunity
      qualityGap: 0,
    });

    // 0.35 * 90 (31.5) + 0.1 * 0 + 0.25 * 100 (25) + 0.3 * 0 = 56.5 -> 57
    expect(result.score).toBe(57);
    expect(result.verdict).toBe("moderate");
    expect(result.renormalized).toBe(false);
  });

  it("boundary extremes: all 0 returns 25 (from 100 - competition) with trend=0", () => {
    const zeroResult = computeGapSignal({
      trend: { score: 0, avgLevel: 0, slopeScore: 0, points: 5 },
      reviewSupport: 0,
      competition: 0, // 100 - 0 = 100 * 0.25 = 25
      qualityGap: 0,
    });
    expect(zeroResult.score).toBe(25);
    expect(zeroResult.verdict).toBe("weak");
  });

  it("boundary extremes: max scores with zero competition returns 100", () => {
    const maxResult = computeGapSignal({
      trend: { score: 100, avgLevel: 100, slopeScore: 100, points: 10 },
      reviewSupport: 100,
      competition: 0, // 100 - 0 = 100
      qualityGap: 100,
    });
    expect(maxResult.score).toBe(100);
    expect(maxResult.verdict).toBe("strong");
  });
});
