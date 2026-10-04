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
          "absolute inset-0 bg-black/25 backdrop-blur-[2px] transition-opacity duration-200 ease-out",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Evidence and supporting analysis"
        className={cn(
          "absolute top-0 right-0 flex h-full w-full max-w-lg md:max-w-xl flex-col border-l border-border/80 bg-background shadow-2xl transition-transform duration-250 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground tracking-tight">Evidence &amp; analysis</h2>
            <p className="text-xs text-muted-foreground truncate">
              {result.category.label} in {result.area.label}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close evidence panel"
            className="flex size-7 items-center justify-center rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-5 text-xs">
          {/* 1. Nearby businesses */}
          <section className="flex flex-col gap-2">
            <div>
              <h3 className="font-semibold text-foreground tracking-tight">Nearby businesses</h3>
              <p className="text-[11px] text-muted-foreground">
                Places identified within the scan radius.
              </p>
            </div>
            <CompetitorsTable
              competitors={result.competitors}
              showAddress={false}
              showSamplingNote={false}
            />
          </section>

          {/* 2. What customers say */}
          <section className="flex flex-col gap-2 border-t border-border/50 pt-5">
            <div>
              <h3 className="font-semibold text-foreground tracking-tight">What customers say</h3>
              <p className="text-[11px] text-muted-foreground">
                Recurring sentiment from local reviews.
              </p>
            </div>
            <ThemesList
              themes={result.themes}
              withheld={result.themesWithheld}
            />
          </section>

          {/* 3. Search demand */}
          <section className="flex flex-col gap-2 border-t border-border/50 pt-5">
            <div>
              <h3 className="font-semibold text-foreground tracking-tight">Search demand</h3>
            </div>
            <TrendChart trend={result.trend} />
          </section>

          {/* 4. Collapsed: How we scored it */}
          <details className="group rounded-lg border border-border/60 bg-muted/15 p-3.5 transition-colors hover:border-border/90">
            <summary className="flex cursor-pointer items-center justify-between font-medium text-foreground select-none">
              <span>How we scored it</span>
              <span className="text-muted-foreground transition-transform duration-200 group-open:rotate-180">
                ▾
              </span>
            </summary>
            <div className="mt-3 space-y-2.5 border-t border-border/40 pt-3 text-xs text-muted-foreground leading-relaxed">
              <p>The opportunity score evaluates four weighted factors:</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded-md border border-border/50 bg-background/50 p-2.5">
                  <span className="font-medium text-foreground">Trend demand</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{(SCORING_WEIGHTS.trend * 100).toFixed(0)}% weight · 12-month search velocity</p>
                </div>
                <div className="rounded-md border border-border/50 bg-background/50 p-2.5">
                  <span className="font-medium text-foreground">Market saturation</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{(SCORING_WEIGHTS.competition * 100).toFixed(0)}% weight · competitor density</p>
                </div>
                <div className="rounded-md border border-border/50 bg-background/50 p-2.5">
                  <span className="font-medium text-foreground">Quality gap</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{(SCORING_WEIGHTS.qualityGap * 100).toFixed(0)}% weight · complaints & low ratings</p>
                </div>
                <div className="rounded-md border border-border/50 bg-background/50 p-2.5">
                  <span className="font-medium text-foreground">Review volume support</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{(SCORING_WEIGHTS.reviewSupport * 100).toFixed(0)}% weight · customer engagement</p>
                </div>
              </div>
              {result.gapSignal.renormalized && (
                <p className="text-[11px] text-muted-foreground">
                  Search trend was unavailable, so weights were redistributed proportionally.
                </p>
              )}
            </div>
          </details>

          {/* 5. Collapsed: How we chose businesses */}
          <details className="group rounded-lg border border-border/60 bg-muted/15 p-3.5 transition-colors hover:border-border/90">
            <summary className="flex cursor-pointer items-center justify-between font-medium text-foreground select-none">
              <span>How we chose businesses</span>
              <span className="text-muted-foreground transition-transform duration-200 group-open:rotate-180">
                ▾
              </span>
            </summary>
            <div className="mt-3 space-y-2 border-t border-border/40 pt-3 text-xs text-muted-foreground leading-relaxed">
              <p>
                To avoid review bias, GapMap samples up to 5 strategic competitors across the area:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong className="text-foreground">2 Anchors:</strong> Highest review volume to gauge customer footfall.</li>
                <li><strong className="text-foreground">2 Low-rated businesses:</strong> Below 4.0★ to uncover customer pain points.</li>
                <li><strong className="text-foreground">1 Median business:</strong> Mid-tier rating for local average standards.</li>
              </ul>
              <p className="text-[11px] text-muted-foreground pt-1">
                This balanced sampling ensures findings reflect both top performers and unmet market needs.
              </p>
            </div>
          </details>

          {/* 6. Collapsed: Technical details */}
          <details className="group rounded-lg border border-border/60 bg-muted/15 p-3.5 transition-colors hover:border-border/90">
            <summary className="flex cursor-pointer items-center justify-between font-medium text-foreground select-none">
              <span>Technical details</span>
              <span className="text-muted-foreground transition-transform duration-200 group-open:rotate-180">
                ▾
              </span>
            </summary>
            <div className="mt-3 space-y-3 border-t border-border/40 pt-3 text-xs text-muted-foreground leading-relaxed">
              <div className="rounded-md border border-border/50 bg-background/50 p-2.5 space-y-1">
                <p><strong className="text-foreground">Data provider:</strong> SerpApi (Google Maps, Google Maps Reviews, Google Trends)</p>
                <p><strong className="text-foreground">Execution mode:</strong> {result.mode}</p>
                <p><strong className="text-foreground">Queries logged:</strong> {result.ledger.length} calls</p>
                <p><strong className="text-foreground">Coordinates:</strong> {meta.lat.toFixed(4)}, {meta.lng.toFixed(4)}</p>
                <p><strong className="text-foreground">Weights:</strong> Demand {(SCORING_WEIGHTS.trend * 100).toFixed(0)}% · Saturation {(SCORING_WEIGHTS.competition * 100).toFixed(0)}% · Quality gap {(SCORING_WEIGHTS.qualityGap * 100).toFixed(0)}% · Volume {(SCORING_WEIGHTS.reviewSupport * 100).toFixed(0)}%</p>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-1.5">Data trace</p>
                <div className="overflow-hidden rounded-md border border-border/60">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/30 text-left text-muted-foreground">
                        <th className="px-2.5 py-1.5 font-normal">Id</th>
                        <th className="px-2.5 py-1.5 font-normal">Source</th>
                        <th className="px-2.5 py-1.5 font-normal">Summary</th>
                        <th className="px-2.5 py-1.5 font-normal">Results</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.ledger.map((entry) => (
                        <tr key={entry.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20">
                          <td className="px-2.5 py-1.5 font-mono text-[11px] text-foreground">{entry.id}</td>
                          <td className="px-2.5 py-1.5 font-medium text-foreground text-[11px]">{formatEngineName(entry.engine)}</td>
                          <td className="px-2.5 py-1.5 text-muted-foreground text-[11px] truncate max-w-40" title={entry.summary}>
                            {entry.summary}
                          </td>
                          <td className="px-2.5 py-1.5 font-mono text-[11px] text-foreground">{entry.resultCount}</td>
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
