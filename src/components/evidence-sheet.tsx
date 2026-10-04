"use client";

import * as React from "react";
import { SCORING_WEIGHTS, type ScanResult } from "@/lib/scoring";
import { CompetitorsTable } from "@/components/competitors-table";
import { ThemesList } from "@/components/themes-list";
import { TrendChart } from "@/components/trend-chart";
import { cn } from "@/lib/utils";

function formatEngineName(engine: string): string {
  switch (engine.toLowerCase()) {
    case "google_maps_reviews":
      return "Customer reviews";
    case "google_trends":
      return "Search demand";
    case "google_maps":
      return "Local places";
    default:
      return engine.replace(/_/g, " ");
  }
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="text-sm font-semibold text-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function EvidenceSheet({
  open,
  onClose,
  result,
  meta,
}: {
  open: boolean;
  onClose: () => void;
  result: ScanResult;
  meta: { lat: number; lng: number; areaLabel: string; categoryId: string };
}) {
  const closeRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <div
      className={cn("fixed inset-0 z-50", !open && "pointer-events-none")}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Evidence and supporting analysis"
        className={cn(
          "absolute top-0 right-0 flex h-full w-full max-w-2xl flex-col bg-background shadow-2xl transition-transform duration-300 ease-out border-l border-border",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
          <div>
            <h2 className="font-semibold text-foreground">Evidence &amp; analysis</h2>
            <p className="text-xs text-muted-foreground">
              {result.category.label} in {result.area.label}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close evidence panel"
            className="flex size-8 items-center justify-center rounded-md text-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-6">
          {/* 1. Nearby businesses */}
          <Section title="Nearby businesses">
            <p className="text-xs text-muted-foreground">
              Direct and indirect competitors identified within the scan area.
            </p>
            <div className="mt-1">
              <CompetitorsTable
                competitors={result.competitors}
                showAddress={false}
                showSamplingNote={false}
              />
            </div>
          </Section>

          {/* 2. What customers say */}
          <Section title="What customers say">
            <div className="mt-1">
              <ThemesList
                themes={result.themes}
                withheld={result.themesWithheld}
              />
            </div>
          </Section>

          {/* 3. Search demand */}
          <Section title="Search demand">
            <div className="mt-1">
              <TrendChart trend={result.trend} />
            </div>
          </Section>

          {/* 4. How we scored it */}
          <Section title="How we scored it">
            <p className="text-xs text-muted-foreground leading-relaxed">
              The opportunity score evaluates four weighted factors:
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
              <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5">
                <span className="font-semibold text-foreground">Trend demand</span>
                <p className="text-muted-foreground mt-0.5">{(SCORING_WEIGHTS.trend * 100).toFixed(0)}% weight · 12-month search velocity</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5">
                <span className="font-semibold text-foreground">Market saturation</span>
                <p className="text-muted-foreground mt-0.5">{(SCORING_WEIGHTS.competition * 100).toFixed(0)}% weight · competitor density</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5">
                <span className="font-semibold text-foreground">Quality gap</span>
                <p className="text-muted-foreground mt-0.5">{(SCORING_WEIGHTS.qualityGap * 100).toFixed(0)}% weight · customer complaints and low ratings</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5">
                <span className="font-semibold text-foreground">Review volume support</span>
                <p className="text-muted-foreground mt-0.5">{(SCORING_WEIGHTS.reviewSupport * 100).toFixed(0)}% weight · total customer engagement</p>
              </div>
            </div>
            {result.gapSignal.renormalized && (
              <p className="text-xs text-muted-foreground">
                Search trend data was unavailable, so weights were redistributed proportionally across places and reviews.
              </p>
            )}
          </Section>

          {/* 5. Collapsed "How we choose businesses" */}
          <details className="group rounded-xl border border-border bg-card p-4 text-xs transition-colors">
            <summary className="flex cursor-pointer items-center justify-between font-semibold text-foreground">
              <span>How we choose businesses</span>
              <span className="text-muted-foreground transition-transform group-open:rotate-180">
                ▾
              </span>
            </summary>
            <div className="mt-3 text-muted-foreground leading-relaxed space-y-2 border-t border-border pt-3">
              <p>
                To avoid review bias, GapMap inspects reviews from up to 5 strategic competitors within the scan area:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong className="text-foreground">2 Anchors:</strong> Highest review volume to gauge customer footfall.</li>
                <li><strong className="text-foreground">2 Low-rated businesses:</strong> Below 4.0★ to identify recurring complaints and unmet needs.</li>
                <li><strong className="text-foreground">1 Median business:</strong> Mid-tier rating for average neighborhood service standards.</li>
              </ul>
              <p className="text-[11px] text-muted-foreground pt-1">
                This balanced sampling ensures we don&apos;t look only at top performers or only at struggling businesses.
              </p>
            </div>
          </details>

          {/* 6. Collapsed "Technical details" */}
          <details className="group rounded-xl border border-border bg-card p-4 text-xs transition-colors">
            <summary className="flex cursor-pointer items-center justify-between font-semibold text-foreground">
              <span>Technical details</span>
              <span className="text-muted-foreground transition-transform group-open:rotate-180">
                ▾
              </span>
            </summary>
            <div className="mt-3 text-muted-foreground leading-relaxed space-y-3 border-t border-border pt-3">
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-1">
                <p><strong className="text-foreground">Data provider:</strong> SerpApi (Google Maps, Google Maps Reviews, Google Trends)</p>
                <p><strong className="text-foreground">Execution mode:</strong> {result.mode}</p>
                <p><strong className="text-foreground">Total queries logged:</strong> {result.ledger.length} calls</p>
                <p><strong className="text-foreground">Coordinates:</strong> {meta.lat.toFixed(4)}, {meta.lng.toFixed(4)}</p>
                <p><strong className="text-foreground">Scoring formula:</strong> Demand ({(SCORING_WEIGHTS.trend * 100).toFixed(0)}%) + Saturation ({(SCORING_WEIGHTS.competition * 100).toFixed(0)}%) + Quality gap ({(SCORING_WEIGHTS.qualityGap * 100).toFixed(0)}%) + Volume support ({(SCORING_WEIGHTS.reviewSupport * 100).toFixed(0)}%)</p>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-2">Data trace</p>
                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/50 text-left">
                        <th className="px-3 py-2 font-medium text-muted-foreground">Id</th>
                        <th className="px-3 py-2 font-medium text-muted-foreground">Source</th>
                        <th className="px-3 py-2 font-medium text-muted-foreground">Summary</th>
                        <th className="px-3 py-2 font-medium text-muted-foreground">Results</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.ledger.map((entry) => (
                        <tr key={entry.id} className="border-b border-border last:border-0">
                          <td className="px-3 py-2 font-mono font-medium text-foreground">{entry.id}</td>
                          <td className="px-3 py-2 text-foreground font-medium">{formatEngineName(entry.engine)}</td>
                          <td className="px-3 py-2 text-muted-foreground truncate max-w-44" title={entry.summary}>
                            {entry.summary}
                          </td>
                          <td className="px-3 py-2 font-mono text-foreground">{entry.resultCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </details>
        </div>
      </aside>
    </div>
  );
}
