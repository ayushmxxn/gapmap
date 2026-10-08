"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons";
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

import { useOverlay } from "@/hooks/use-overlay";

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
  const asideRef = React.useRef<HTMLElement>(null);

  useOverlay({
    isOpen: open,
    onClose,
    containerRef: asideRef,
    initialFocusRef: closeRef,
  });

  const isCityScope = result.scope?.type === "city" || result.area.scope === "city";
  const locationName =
    result.scope?.cityName ||
    result.area.label.split(",")[0] ||
    "the area";

  return (
    <div
      className={cn("fixed inset-0 z-50", !open && "pointer-events-none")}
      aria-hidden={!open}
    >
      <div
        data-cuelume-close
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200 ease-out touch-none",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <aside
        ref={asideRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="evidence-sheet-title"
        className={cn(
          "absolute top-0 right-0 flex h-full w-full max-w-lg md:max-w-xl flex-col border-l border-border/80 bg-background shadow-xl transition-transform duration-250 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-border/60 bg-background/95 backdrop-blur-sm px-6 py-4 pt-[max(1rem,env(safe-area-inset-top,0px))] pr-[max(1.25rem,env(safe-area-inset-right,0px))]">
          <div className="min-w-0 pr-4">
            <h2 id="evidence-sheet-title" className="text-sm font-semibold text-foreground tracking-tight">Evidence &amp; analysis</h2>
            <p className="text-xs font-medium text-foreground/80 truncate mt-0.5">
              {result.category.label} in {result.area.label}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Data and observations behind the Gap Signal opportunity score.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            data-cuelume-close
            onClick={onClose}
            aria-label="Close evidence panel"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-95 cursor-pointer shrink-0 mt-0.5 outline-none"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-7 overflow-y-auto overscroll-contain px-6 py-6 pb-[max(1.75rem,env(safe-area-inset-bottom,0px))] pr-[max(1.5rem,env(safe-area-inset-right,0px))] pl-[max(1.5rem,env(safe-area-inset-left,0px))] text-xs">
          <section className="flex flex-col gap-3">
            <div>
              <h3 className="font-semibold text-foreground tracking-tight text-sm">
                {isCityScope
                  ? `${result.competitors.length} businesses found across ${locationName}`
                  : `${result.competitors.length} businesses found within scan radius`}
              </h3>
              <p className="text-[11.5px] text-muted-foreground mt-0.5">
                Top competitor establishments identified from local directory maps.
              </p>
            </div>
            <CompetitorsTable
              competitors={result.competitors}
              showAddress={false}
              showSamplingNote={false}
              scope={result.scope?.type ?? (result.area.scope ?? "neighborhood")}
              initialLimit={6}
            />
          </section>

          <section className="flex flex-col gap-3 border-t border-border/40 pt-6">
            <div>
              <h3 className="font-semibold text-foreground tracking-tight text-sm">What customers say</h3>
              <p className="text-[11.5px] text-muted-foreground mt-0.5">
                Strongest recurring feedback and topics from customer reviews.
              </p>
            </div>
            <ThemesList
              themes={result.themes}
              withheld={result.themesWithheld}
            />
          </section>

          <section className="flex flex-col gap-3 border-t border-border/40 pt-6">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-semibold text-foreground tracking-tight text-sm">Search demand</h3>
              <span className="text-[11px] text-muted-foreground/70">12-month Google Trends index</span>
            </div>
            <TrendChart trend={result.trend} />
          </section>

          <section className="border-t border-border/40 pt-6">
            <details className="group rounded-xl bg-muted/50 p-4">
              <summary className="flex cursor-pointer items-center justify-between font-medium text-foreground select-none">
                <span className="text-xs font-semibold">How we scored it</span>
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={14}
                  strokeWidth={2}
                  className="text-muted-foreground transition-transform duration-200 group-open:rotate-180"
                />
              </summary>
              <div className="mt-3.5 space-y-3 border-t border-border/40 pt-3.5 text-xs text-muted-foreground leading-relaxed">
                <p className="text-foreground/90 font-normal">
                  The Gap Signal opportunity score (0–100) measures whether a viable gap exists to open a new business. It balances market demand against existing saturation and customer satisfaction.
                </p>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 pt-1">
                  <div className="rounded-lg border border-border/50 bg-card p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">Trend demand</span>
                      <span className="text-[11px] font-semibold text-foreground">{(SCORING_WEIGHTS.trend * 100).toFixed(0)}%</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">12-month online search interest velocity.</p>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-card p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">Market saturation</span>
                      <span className="text-[11px] font-semibold text-foreground">{(SCORING_WEIGHTS.competition * 100).toFixed(0)}%</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">Competitor density across the local trade area.</p>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-card p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">Quality gap</span>
                      <span className="text-[11px] font-semibold text-foreground">{(SCORING_WEIGHTS.qualityGap * 100).toFixed(0)}%</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">Unmet customer satisfaction and low competitor ratings.</p>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-card p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">Review volume support</span>
                      <span className="text-[11px] font-semibold text-foreground">{(SCORING_WEIGHTS.reviewSupport * 100).toFixed(0)}%</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">Overall customer engagement and review activity.</p>
                  </div>
                </div>

                {result.gapSignal.renormalized && (
                  <p className="text-[11px] text-muted-foreground italic pt-1">
                    Search trend was unavailable, so weights were redistributed proportionally across remaining factors.
                  </p>
                )}
              </div>
            </details>
          </section>

          <section className="pt-3">
            <details className="group rounded-xl bg-muted/50 p-4">
              <summary className="flex cursor-pointer items-center justify-between font-medium text-foreground select-none">
                <span className="text-xs font-semibold">Technical details</span>
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={14}
                  strokeWidth={2}
                  className="text-muted-foreground transition-transform duration-200 group-open:rotate-180"
                />
              </summary>
              <div className="mt-3.5 space-y-4 border-t border-border/40 pt-3.5 text-xs text-muted-foreground leading-relaxed">
                <div className="rounded-lg border border-border/50 bg-card p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between py-0.5 border-b border-border/30">
                    <span className="text-muted-foreground">Data provider</span>
                    <span className="font-medium text-foreground">SerpApi (Maps, Reviews, Trends)</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-border/30">
                    <span className="text-muted-foreground">Scan scope</span>
                    <span className="font-medium text-foreground">{result.scope?.label ?? (result.area.scope === "city" ? "City-wide scan" : "Neighborhood scan (1.5 km)")}</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-border/30">
                    <span className="text-muted-foreground">Coordinates</span>
                    <span className="font-mono text-foreground">{meta.lat.toFixed(4)}, {meta.lng.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-border/30">
                    <span className="text-muted-foreground">Execution mode</span>
                    <span className="font-mono text-foreground capitalize">{result.mode}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-muted-foreground">Queries logged</span>
                    <span className="font-mono text-foreground">{result.ledger.length} calls</span>
                  </div>
                </div>

                {/* Sampling Methodology */}
                <div className="space-y-1.5">
                  <p className="font-semibold text-foreground text-xs">Sampling methodology</p>
                  <p className="text-[11.5px] text-muted-foreground">
                    To avoid review bias, GapMap samples up to 5 strategic competitors across the area:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-[11.5px] text-muted-foreground">
                    <li><strong className="text-foreground font-medium">2 Anchors:</strong> Highest review volume to gauge customer footfall.</li>
                    <li><strong className="text-foreground font-medium">2 Low-rated businesses:</strong> Below 4.0★ to uncover customer pain points.</li>
                    <li><strong className="text-foreground font-medium">1 Median business:</strong> Mid-tier rating for local average standards.</li>
                  </ul>
                </div>

                {/* Data Trace / Evidence Ledger */}
                <div className="space-y-1.5 pt-1">
                  <p className="font-semibold text-foreground text-xs">Data trace</p>
                  <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border/60 bg-muted/25 text-left text-muted-foreground">
                          <th className="px-3 py-2 font-normal">Id</th>
                          <th className="px-3 py-2 font-normal">Source</th>
                          <th className="px-3 py-2 font-normal">Summary</th>
                          <th className="px-3 py-2 font-normal">Results</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.ledger.map((entry) => (
                          <tr key={entry.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20">
                            <td className="px-3 py-2 font-mono text-[11px] text-foreground">{entry.id}</td>
                            <td className="px-3 py-2 font-medium text-foreground text-[11px]">{formatEngineName(entry.engine)}</td>
                            <td className="px-3 py-2 text-muted-foreground text-[11px] truncate max-w-40" title={entry.summary}>
                              {entry.summary}
                            </td>
                            <td className="px-3 py-2 font-mono text-[11px] text-foreground">{entry.resultCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </details>
          </section>
        </div>
      </aside>
    </div>
  );
}
