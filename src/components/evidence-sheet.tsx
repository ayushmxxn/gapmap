"use client";

import * as React from "react";
import { SCORING_WEIGHTS, type ScanResult } from "@/lib/scoring";
import { CompetitorsTable } from "@/components/competitors-table";
import { ThemesList } from "@/components/themes-list";
import { TrendChart } from "@/components/trend-chart";
import { cn } from "@/lib/utils";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
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
          "absolute inset-0 bg-black/40 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Supporting evidence"
        className={cn(
          "absolute top-0 right-0 flex h-full w-full max-w-xl flex-col bg-background shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 className="font-semibold">Supporting evidence</h2>
            <p className="text-sm text-muted-foreground">
              {result.category.label} in {result.area.label}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close evidence panel"
            className="flex size-9 items-center justify-center rounded-md text-xl leading-none text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            ×
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-7 overflow-y-auto px-5 py-5">
          <Section title={`Places nearby (${result.stats.places})`}>
            <CompetitorsTable competitors={result.competitors} />
          </Section>

          <Section title="What customers keep saying">
            <ThemesList
              themes={result.themes}
              withheld={result.themesWithheld}
              reviewsExamined={result.stats.reviewsExamined}
            />
          </Section>

          <Section title="Demand over time">
            <TrendChart trend={result.trend} />
          </Section>

          <Section title="Data & methodology">
            <p className="text-sm text-muted-foreground">
              Gap Signal v0 blends four fixed signals: trend demand{" "}
              {(SCORING_WEIGHTS.trend * 100).toFixed(0)}%, review support{" "}
              {(SCORING_WEIGHTS.reviewSupport * 100).toFixed(0)}%, saturation{" "}
              {(SCORING_WEIGHTS.competition * 100).toFixed(0)}% (inverted), and
              quality gap {(SCORING_WEIGHTS.qualityGap * 100).toFixed(0)}%.
              {result.gapSignal.renormalized &&
                " No trend data was returned, so weights were redistributed across Maps and review evidence."}
            </p>
            <ul className="flex flex-col gap-1.5 font-mono text-xs text-muted-foreground">
              {result.ledger.map((entry) => (
                <li key={entry.id}>
                  <span className="font-semibold text-foreground">
                    {entry.id}
                  </span>{" "}
                  [{entry.engine}] {entry.summary} → {entry.resultCount}{" "}
                  results
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              {result.ledger.length} SerpApi calls this scan (free tier:
              250/month; cached repeats are free). Scanned{" "}
              {meta.lat.toFixed(4)}, {meta.lng.toFixed(4)} · {meta.areaLabel} ·{" "}
              {meta.categoryId} · Mode: {result.mode}. A signal, not proof.
            </p>
          </Section>
        </div>
      </aside>
    </div>
  );
}
