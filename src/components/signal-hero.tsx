import { VERDICT_LABEL, type ScanResult } from "@/lib/scoring";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* Display-only plain-language mappings. Scoring is untouched. */

function demandWords(trend: ScanResult["trend"]): string {
  if (!trend) return "No trend data";
  const base =
    trend.score >= 65
      ? "Demand looks strong"
      : trend.score >= 45
        ? "Demand looks steady"
        : "Demand looks soft";
  const dir =
    trend.slopeScore > 55
      ? " and rising"
      : trend.slopeScore < 45
        ? " but softening"
        : "";
  return base + dir;
}

function competitionWords(value: number): string {
  if (value >= 65) return "Crowded market";
  if (value >= 40) return "Partly served";
  return "Sparsely served";
}

function experienceWords(value: number): string {
  if (value >= 60) return "Clear quality gap";
  if (value >= 35) return "Some weak spots";
  return "Strong incumbents";
}

const VERDICT_SENTENCE: Record<ScanResult["gapSignal"]["verdict"], string> = {
  strong:
    "This looks like a real opening — demand is present and current options leave room.",
  moderate:
    "There may be room here — several signs point to unmet demand.",
  weak: "This looks well served — demand is met by strong current options.",
};

export function SignalSummary({
  result,
  onExplore,
}: {
  result: ScanResult;
  onExplore: () => void;
}) {
  const { gapSignal, components } = result;
  const rated = result.competitors.filter((c) => c.rating != null);
  const avgRating =
    rated.length > 0
      ? rated.reduce((a, c) => a + (c.rating ?? 0), 0) / rated.length
      : null;

  const signals = [
    { label: "Demand", words: demandWords(result.trend) },
    { label: "Competition", words: competitionWords(components.competition) },
    { label: "Customer experience", words: experienceWords(components.qualityGap) },
  ];

  return (
    <section className="flex h-full flex-col rounded-xl border border-border bg-card p-5 md:p-6">
      <p className="text-sm text-muted-foreground">
        {result.category.label} in {result.area.label}
      </p>

      <div className="mt-2 flex items-center gap-4">
        <p className="text-6xl font-semibold tracking-tight">
          {gapSignal.score}
          <span className="text-2xl font-normal text-muted-foreground">/100</span>
        </p>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-sm font-semibold",
            gapSignal.verdict === "strong" &&
              "bg-green-500/15 text-green-700 dark:text-green-400",
            gapSignal.verdict === "moderate" &&
              "bg-amber-500/15 text-amber-700 dark:text-amber-400",
            gapSignal.verdict === "weak" && "bg-muted text-muted-foreground",
          )}
        >
          {VERDICT_LABEL[gapSignal.verdict]}
        </span>
      </div>

      <p className="mt-2 text-[15px] leading-snug">
        {VERDICT_SENTENCE[gapSignal.verdict]}
      </p>

      <dl className="mt-4 flex flex-col gap-2 border-t border-border pt-3 text-[15px]">
        {signals.map((s) => (
          <div
            key={s.label}
            className="flex items-baseline justify-between gap-3"
          >
            <dt className="text-muted-foreground">{s.label}</dt>
            <dd className="text-right font-medium">{s.words}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">
          {result.stats.places} places
        </span>{" "}
        ·{" "}
        <span className="font-semibold text-foreground">
          {result.stats.totalReviews.toLocaleString("en-IN")} reviews
        </span>{" "}
        ·{" "}
        <span className="font-semibold text-foreground">
          {avgRating != null ? `${avgRating.toFixed(1)}★ average` : "unrated"}
        </span>
      </p>

      <ul className="mt-3 flex flex-col gap-2">
        {result.insights.slice(0, 3).map((insight) => (
          <li
            key={insight.text}
            className="border-l-2 border-primary/40 pl-3 text-sm leading-snug"
          >
            {insight.text}
          </li>
        ))}
      </ul>

      <Button onClick={onExplore} className="mt-4 w-full">
        Explore evidence
      </Button>
    </section>
  );
}
