import type { ScanResult } from "@/lib/scoring";

export function formatReviewCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return count.toLocaleString("en-IN");
}

export function getOpportunityVerdict(
  verdict: "strong" | "moderate" | "weak",
): string {
  switch (verdict) {
    case "strong":
      return "Strong opportunity";
    case "moderate":
      return "Good opportunity";
    case "weak":
      return "Low opportunity";
  }
}

export function getPlainEnglishConclusion(result: ScanResult): string {
  const { gapSignal, components, area, category, competitors } = result;

  let areaName = area.label.split(",")[0]?.trim() || "This area";
  if (
    areaName.toLowerCase().includes("custom") ||
    areaName.toLowerCase().includes("selected") ||
    areaName.toLowerCase().includes("pin")
  ) {
    areaName = "This area";
  }

  const catLabel = category.label.toLowerCase();
  const pluralCat = catLabel.endsWith("s") ? catLabel : `${catLabel}s`;

  const ratedCompetitors = competitors.filter((c) => c.rating != null);
  const avgRating =
    ratedCompetitors.length > 0
      ? ratedCompetitors.reduce((acc, c) => acc + (c.rating ?? 0), 0) /
        ratedCompetitors.length
      : null;

  if (gapSignal.verdict === "weak") {
    if (components.competition >= 50 && (avgRating == null || avgRating >= 4.0)) {
      return `${areaName} already has strong ${catLabel} options.`;
    }
    if (components.competition >= 60) {
      return `${areaName} is already well served by established ${pluralCat}.`;
    }
    if (components.trend != null && components.trend < 45) {
      return `${areaName} currently shows limited search interest for ${pluralCat}.`;
    }
    return `${areaName} already has strong ${catLabel} options.`;
  }

  if (gapSignal.verdict === "strong") {
    if (components.qualityGap >= 50) {
      return `${areaName} shows high demand for ${pluralCat} with noticeable gaps in customer satisfaction.`;
    }
    if (components.competition < 40) {
      return `${areaName} has growing demand and relatively few ${pluralCat} nearby.`;
    }
    return `${areaName} presents an open market with strong demand for new ${pluralCat}.`;
  }

  if (components.qualityGap >= 50) {
    return `${areaName} has established competitors, but customer feedback points to room for a better ${catLabel}.`;
  }
  if (components.competition >= 55) {
    return `${areaName} has steady demand, but faces competition from established ${pluralCat}.`;
  }
  return `${areaName} shows steady demand with a balanced competitive landscape.`;
}

export function getDemandState(trend: ScanResult["trend"]): string {
  if (!trend) return "Steady";
  const { avgLevel, slopeScore } = trend;
  if (avgLevel >= 60) {
    if (slopeScore > 55) return "Steady and rising";
    if (slopeScore < 45) return "High but softening";
    return "High";
  }
  if (avgLevel >= 40) {
    if (slopeScore > 55) return "Steady and rising";
    if (slopeScore < 45) return "Steady but softening";
    return "Steady";
  }
  if (slopeScore > 55) return "Low but rising";
  return "Soft";
}

export function getCompetitionState(competitionScore: number): string {
  if (competitionScore >= 55) return "High";
  if (competitionScore >= 35) return "Moderate";
  return "Low";
}

export function getExperienceState(qualityGap: number): string {
  if (qualityGap < 35) return "Strong";
  if (qualityGap < 55) return "Mixed";
  return "Room for improvement";
}
