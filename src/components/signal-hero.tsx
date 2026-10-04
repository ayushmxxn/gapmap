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
    <section className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 md:p-8 shadow-xs">
      <div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{result.area.label}</span>
          <span>·</span>
          <span className="font-medium text-foreground">{result.category.label}</span>
        </div>

        <h1 className="mt-2 text-xl font-semibold tracking-tight text-foreground md:text-2xl">
          Should I consider opening this business here?
        </h1>

        <div className="mt-5 flex items-baseline gap-3">
          <p className="text-5xl font-semibold tracking-tight text-foreground md:text-6xl">
            {gapSignal.score}
            <span className="text-2xl font-normal text-muted-foreground">/100</span>
          </p>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
              gapSignal.verdict === "strong" &&
                "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
              gapSignal.verdict === "moderate" &&
                "bg-amber-500/15 text-amber-700 dark:text-amber-400",
              gapSignal.verdict === "weak" &&
                "bg-muted text-muted-foreground",
            )}
          >
            {verdictLabel}
          </span>
        </div>

        <p className="mt-4 text-base font-medium leading-relaxed text-foreground md:text-[17px]">
          &ldquo;{conclusion}&rdquo;
        </p>

        <div className="mt-6 border-t border-border pt-5">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {factors.map((f) => (
              <div
                key={f.label}
                className="flex flex-col gap-1 rounded-lg border border-border/60 bg-muted/30 p-3"
              >
                <dt className="text-xs text-muted-foreground">{f.label}</dt>
                <dd className="text-sm font-semibold text-foreground">
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground md:text-sm">
          <span className="font-semibold text-foreground">
            {result.stats.places} nearby places
          </span>{" "}
          ·{" "}
          <span className="font-semibold text-foreground">
            {formatReviewCount(result.stats.totalReviews)} reviews
          </span>{" "}
          ·{" "}
          <span className="font-semibold text-foreground">
            {avgRating != null ? `${avgRating.toFixed(1)}★ average` : "Unrated"}
          </span>
        </p>

        <Button
          type="button"
          onClick={onOpenEvidence}
          variant="outline"
          size="sm"
          className="font-medium cursor-pointer"
        >
          See the evidence →
        </Button>
      </div>
    </section>
  );
}
