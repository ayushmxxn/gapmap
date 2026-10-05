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

  return (
    <section className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 sm:p-7 xl:p-8 shadow-xs h-full">
      <div>
        {/* 1. Context: Location + Business analyzed */}
        <div className="flex items-center gap-1.5 text-xs sm:text-[13px] text-muted-foreground font-medium truncate">
          <span className="font-semibold text-foreground truncate max-w-72 sm:max-w-md">{result.area.label}</span>
          <span className="text-muted-foreground/35">·</span>
          <span className="text-foreground/85 whitespace-nowrap">{result.category.label}</span>
        </div>

        {/* 2 & 3. Opportunity Score & Human Verdict */}
        <div className="mt-4 sm:mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-6xl sm:text-[68px] font-semibold tracking-[-0.04em] tabular-nums text-foreground leading-none">
              {gapSignal.score}
            </span>
            <span className="text-xl sm:text-2xl font-light tracking-tight text-muted-foreground/60 select-none">
              /100
            </span>
          </div>

          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium self-center",
              gapSignal.verdict === "strong" &&
                "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
              gapSignal.verdict === "moderate" &&
                "bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
              gapSignal.verdict === "weak" &&
                "bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400",
            )}
          >
            {verdictLabel}
          </span>
        </div>

        {/* 4. Why: Concise Plain-English Synthesis */}
        <p className="mt-3 sm:mt-4 text-sm sm:text-[15px] font-normal leading-relaxed text-foreground/90 text-balance max-w-xl">
          {conclusion}
        </p>

        {/* 3 Supporting Factors: Clean, borderless columns with whitespace */}
        <div className="mt-4.5 pt-3.5 sm:mt-5 sm:pt-4 border-t border-border/50">
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {factors.map((f) => (
              <div key={f.label} className="flex flex-col gap-0.5 sm:gap-1">
                <span className="text-[11px] sm:text-xs font-normal text-muted-foreground">
                  {f.label}
                </span>
                <span className="text-xs sm:text-[14px] lg:text-[15px] font-semibold text-foreground tracking-tight">
                  {f.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5 & 6. Mapped Competitors Summary & Evidence Action */}
      <div className="mt-4.5 pt-3.5 sm:mt-5 sm:pt-4 border-t border-border/50 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 text-xs sm:text-[12.5px] text-muted-foreground flex-wrap">
          <span className="font-semibold text-foreground">{result.stats.places}</span>
          <span>{isCityScope ? "places mapped" : "nearby competitors"}</span>
          <span className="text-muted-foreground/35 mx-1">·</span>
          <span className="font-semibold text-foreground">
            {formatReviewCount(result.stats.totalReviews)}
          </span>
          <span>reviews</span>
          {avgRating != null && (
            <>
              <span className="text-muted-foreground/35 mx-1">·</span>
              <span className="font-semibold text-foreground">{avgRating.toFixed(1)}★</span>
              <span>avg</span>
            </>
          )}
        </div>

        <Button
          type="button"
          data-cuelume-open
          onClick={onOpenEvidence}
          variant="ghost"
          size="sm"
          className="h-8.5 rounded-lg px-3.5 text-xs font-medium cursor-pointer border-0 shadow-none bg-[#f2f2f2] hover:bg-[#e8e8e8] text-foreground dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-all active:scale-[0.98] shrink-0 gap-1.5 self-start sm:self-auto"
        >
          <span>See the evidence</span>
          <HugeiconsIcon icon={ArrowRight01Icon} size={13} strokeWidth={2} />
        </Button>
      </div>
    </section>
  );
}
