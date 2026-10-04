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
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
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

  const isCityScope = result.scope?.type === "city" || result.area.scope === "city";
  const scopeLabel =
    result.scope?.label ??
    (isCityScope
      ? `City-wide scan · ${result.scope?.cityName || result.area.label.split(",")[0]}`
      : "Neighborhood scan · 1.5 km");

  return (
    <section className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 md:p-8 shadow-xs">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <span className="font-semibold text-foreground">{result.area.label}</span>
            <span className="text-muted-foreground/40">·</span>
            <span>{result.category.label}</span>
          </div>

          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-tight",
              isCityScope
                ? "border border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-400"
                : "border border-border/80 bg-muted/50 text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full shrink-0",
                isCityScope ? "bg-sky-500" : "bg-muted-foreground/70",
              )}
            />
            <span>{scopeLabel}</span>
          </span>
        </div>

        <h1 className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight text-foreground leading-tight">
          Should I consider opening this business here?
        </h1>

        <div className="mt-6 flex flex-wrap items-baseline gap-4">
          <div className="flex items-baseline">
            <span className="text-5xl md:text-6xl font-semibold tracking-tight tabular-nums text-foreground">
              {gapSignal.score}
            </span>
            <span className="text-xl font-normal text-muted-foreground/70 ml-1.5">/100</span>
          </div>

          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
              gapSignal.verdict === "strong" &&
                "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
              gapSignal.verdict === "moderate" &&
                "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400",
              gapSignal.verdict === "weak" &&
                "border-zinc-500/20 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full shrink-0",
                gapSignal.verdict === "strong" && "bg-emerald-500",
                gapSignal.verdict === "moderate" && "bg-amber-500",
                gapSignal.verdict === "weak" && "bg-zinc-400 dark:bg-zinc-600",
              )}
            />
            <span>{verdictLabel}</span>
          </div>
        </div>

        <p className="mt-4 text-base md:text-lg font-normal leading-relaxed text-foreground/90">
          &ldquo;{conclusion}&rdquo;
        </p>

        <div className="mt-8 border-t border-border/50 pt-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {factors.map((f) => (
              <div
                key={f.label}
                className="flex flex-col gap-1 rounded-xl border border-border/60 bg-muted/25 p-3.5 transition-colors hover:border-border/90"
              >
                <span className="text-[11px] font-medium text-muted-foreground">{f.label}</span>
                <span className="text-sm font-semibold text-foreground tracking-tight">{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4 border-t border-border/50 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{result.stats.places}</span>{" "}
          {isCityScope ? "places across city" : "nearby places"}
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
          className="h-8.5 rounded-lg px-3.5 text-xs font-medium cursor-pointer shadow-2xs hover:bg-muted transition-all active:scale-[0.98] shrink-0 gap-1.5"
        >
          <span>See the evidence</span>
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={2} />
        </Button>
      </div>
    </section>
  );
}
