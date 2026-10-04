import type { ScanResult } from "@/lib/scoring";
import {
  formatReviewCount,
  getCompetitionState,
  getDemandState,
  getExperienceState,
  getOpportunityVerdict,
  getPlainEnglishConclusion,
} from "@/lib/result-utils";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SignalSummaryProps {
  result: ScanResult;
  onOpenEvidence: () => void;
}

export function SignalSummary({ result, onOpenEvidence }: SignalSummaryProps) {
  const { gapSignal, components } = result;

  const rated = result.competitors.filter((c) => c.rating != null);
  const avgRating =
    rated.length > 0
      ? rated.reduce((a, c) => a + (c.rating ?? 0), 0) / rated.length
      : null;

  const factors = [
    { label: "Demand", value: getDemandState(result.trend) },
    {
      label: "Competition",
      value: getCompetitionState(components.competition),
    },
    {
      label: "Customer experience",
      value: getExperienceState(components.qualityGap),
    },
  ];

  const verdictLabel = getOpportunityVerdict(gapSignal.verdict);
  const conclusion = getPlainEnglishConclusion(result);

  return (
    <section className="flex flex-col justify-between rounded-2xl border border-border/70 bg-card/60 p-6 md:p-8 backdrop-blur-xs">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <span className="text-foreground">{result.area.label}</span>
          <span className="text-muted-foreground/40">/</span>
          <span>{result.category.label}</span>
        </div>

        <h1 className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight text-foreground leading-tight">
          Should I consider opening this business here?
        </h1>

        <div className="mt-6 flex flex-wrap items-baseline gap-4">
          <div className="flex items-baseline">
            <span className="text-5xl md:text-6xl font-semibold tracking-tight tabular-nums text-foreground">
              {gapSignal.score}
            </span>
            <span className="text-xl font-normal text-muted-foreground ml-1.5">/100</span>
          </div>

          <div className="inline-flex items-center gap-2 text-sm font-medium">
            <span
              className={cn(
                "size-2 rounded-full shrink-0",
                gapSignal.verdict === "strong" && "bg-emerald-500",
                gapSignal.verdict === "moderate" && "bg-amber-500",
                gapSignal.verdict === "weak" && "bg-zinc-400 dark:bg-zinc-600",
              )}
            />
            <span
              className={cn(
                gapSignal.verdict === "strong" && "text-emerald-700 dark:text-emerald-400",
                gapSignal.verdict === "moderate" && "text-amber-700 dark:text-amber-400",
                gapSignal.verdict === "weak" && "text-muted-foreground",
              )}
            >
              {verdictLabel}
            </span>
          </div>
        </div>

        <p className="mt-4 text-base md:text-lg font-normal leading-relaxed text-foreground/90">
          &ldquo;{conclusion}&rdquo;
        </p>

        <div className="mt-8 border-t border-border/50 pt-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {factors.map((f) => (
              <div key={f.label} className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">{f.label}</span>
                <span className="text-sm font-medium text-foreground">{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4 border-t border-border/50 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{result.stats.places}</span> nearby places
          <span className="text-muted-foreground/40 mx-1.5">·</span>
          <span className="font-medium text-foreground">{formatReviewCount(result.stats.totalReviews)}</span> reviews
          <span className="text-muted-foreground/40 mx-1.5">·</span>
          <span className="font-medium text-foreground">
            {avgRating != null ? `${avgRating.toFixed(1)}★` : "Unrated"}
          </span> average
        </p>

        <Button
          type="button"
          onClick={onOpenEvidence}
          variant="outline"
          size="sm"
          className="h-8 rounded-lg px-3.5 text-xs font-medium cursor-pointer transition-colors hover:bg-muted shrink-0"
        >
          See the evidence →
        </Button>
      </div>
    </section>
  );
}
