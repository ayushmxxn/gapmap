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
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
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
          "absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200 ease-out touch-none",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Evidence and supporting analysis"
        className={cn(
          "absolute top-0 right-0 flex h-full w-full max-w-lg md:max-w-xl flex-col border-l border-border/80 bg-background shadow-xl transition-transform duration-250 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5 pt-[max(0.875rem,env(safe-area-inset-top,0px))] pr-[max(1.25rem,env(safe-area-inset-right,0px))]">
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
            className="flex size-9 sm:size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-95 cursor-pointer"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-5 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] pr-[max(1.25rem,env(safe-area-inset-right,0px))] pl-[max(1.25rem,env(safe-area-inset-left,0px))] text-xs">
          {/* 1. Nearby businesses */}
          <section className="flex flex-col gap-2.5">
            <div>
              <h3 className="font-semibold text-foreground tracking-tight text-sm">
                {result.scope?.type === "city" || result.area.scope === "city"
                  ? "Discovered businesses"
                  : "Nearby businesses"}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {result.scope?.type === "city" || result.area.scope === "city"
                  ? `Places identified across ${result.scope?.cityName || result.area.label}.`
                  : "Places identified within the scan radius."}
              </p>
            </div>
            <CompetitorsTable
              competitors={result.competitors}
              showAddress={false}
              showSamplingNote={false}
              scope={result.scope?.type ?? (result.area.scope ?? "neighborhood")}
            />
          </section>

          {/* 2. What customers say */}
          <section className="flex flex-col gap-2.5 border-t border-border/50 pt-5">
            <div>
              <h3 className="font-semibold text-foreground tracking-tight text-sm">What customers say</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Recurring sentiment from local reviews.
              </p>
            </div>
            <ThemesList
              themes={result.themes}
              withheld={result.themesWithheld}
            />
          </section>

          {/* 3. Search demand */}
          <section className="flex flex-col gap-2.5 border-t border-border/50 pt-5">
            <div>
              <h3 className="font-semibold text-foreground tracking-tight text-sm">Search demand</h3>
            </div>
            <TrendChart trend={result.trend} />
          </section>

          {/* 4. Collapsed: How we scored it */}
          <details className="group rounded-xl border border-border/70 bg-card p-3.5 shadow-2xs transition-all hover:border-border">
            <summary className="flex cursor-pointer items-center justify-between font-medium text-foreground select-none">
              <span>How we scored it</span>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={14}
                strokeWidth={2}
                className="text-muted-foreground transition-transform duration-200 group-open:rotate-180"
              />
            </summary>
            <div className="mt-3 space-y-2.5 border-t border-border/40 pt-3 text-xs text-muted-foreground leading-relaxed">
              <p>The opportunity score evaluates four weighted factors:</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-border/50 bg-muted/20 p-2.5">
                  <span className="font-medium text-foreground">Trend demand</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{(SCORING_WEIGHTS.trend * 100).toFixed(0)}% weight · 12-month search velocity</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-muted/20 p-2.5">
                  <span className="font-medium text-foreground">Market saturation</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{(SCORING_WEIGHTS.competition * 100).toFixed(0)}% weight · competitor density</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-muted/20 p-2.5">
                  <span className="font-medium text-foreground">Quality gap</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{(SCORING_WEIGHTS.qualityGap * 100).toFixed(0)}% weight · complaints & low ratings</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-muted/20 p-2.5">
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
          <details className="group rounded-xl border border-border/70 bg-card p-3.5 shadow-2xs transition-all hover:border-border">
            <summary className="flex cursor-pointer items-center justify-between font-medium text-foreground select-none">
              <span>How we chose businesses</span>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={14}
                strokeWidth={2}
                className="text-muted-foreground transition-transform duration-200 group-open:rotate-180"
              />
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
          <details className="group rounded-xl border border-border/70 bg-card p-3.5 shadow-2xs transition-all hover:border-border">
            <summary className="flex cursor-pointer items-center justify-between font-medium text-foreground select-none">
              <span>Technical details</span>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={14}
                strokeWidth={2}
                className="text-muted-foreground transition-transform duration-200 group-open:rotate-180"
              />
            </summary>
            <div className="mt-3 space-y-3 border-t border-border/40 pt-3 text-xs text-muted-foreground leading-relaxed">
              <div className="rounded-lg border border-border/50 bg-muted/20 p-2.5 space-y-1">
                <p><strong className="text-foreground">Data provider:</strong> SerpApi (Google Maps, Google Maps Reviews, Google Trends)</p>
                <p><strong className="text-foreground">Execution mode:</strong> {result.mode}</p>
                <p><strong className="text-foreground">Scan scope:</strong> {result.scope?.label ?? (result.area.scope === "city" ? "City-wide scan" : "Neighborhood scan (1.5 km)")}</p>
                <p><strong className="text-foreground">Queries logged:</strong> {result.ledger.length} calls</p>
                <p><strong className="text-foreground">Coordinates:</strong> {meta.lat.toFixed(4)}, {meta.lng.toFixed(4)}</p>
                <p><strong className="text-foreground">Weights:</strong> Demand {(SCORING_WEIGHTS.trend * 100).toFixed(0)}% · Saturation {(SCORING_WEIGHTS.competition * 100).toFixed(0)}% · Quality gap {(SCORING_WEIGHTS.qualityGap * 100).toFixed(0)}% · Volume {(SCORING_WEIGHTS.reviewSupport * 100).toFixed(0)}%</p>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-1.5">Data trace</p>
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
        </div>
      </aside>
    </div>
  );
}
