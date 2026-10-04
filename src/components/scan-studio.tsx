"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { getCategory } from "@/lib/categories";
import { postScan } from "@/lib/scan-client";
import { useAppStore } from "@/store/app";
import { ScanForm } from "@/components/scan-form";
import { MapWrapper } from "@/components/map-wrapper";
import { SignalSummary } from "@/components/signal-hero";
import { EvidenceSheet } from "@/components/evidence-sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

/**
 * URL is the single source of truth for area/category state.
 * On every params change (initial load, shared links, back/forward),
 * the store is synced to the URL first — then a scan runs exactly once
 * per unique param set (key guard also covers StrictMode double-effects).
 * Form scans use window.history.replaceState, which does not re-trigger
 * this hook, so no duplicate scans occur.
 */
function useUrlSync() {
  const params = useSearchParams();
  const lastKey = React.useRef<string | null>(null);
  const { setArea, setCategoryId, setStatus, setResult, setError } =
    useAppStore();

  React.useEffect(() => {
    const lat = Number(params.get("lat"));
    const lng = Number(params.get("lng"));
    const cat = params.get("cat");
    const area = params.get("area");
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !cat || !area) return;
    if (!getCategory(cat)) return;
    setArea(lat, lng, area);
    setCategoryId(cat);
    const key = `${lat}|${lng}|${cat}|${area}`;
    if (lastKey.current === key) return;
    lastKey.current = key;
    setStatus("loading");
    setError(null);
    setResult(null);
    postScan({ lat, lng, categoryId: cat, areaLabel: area }).then(
      (data) => {
        setResult(data);
        setStatus("success");
      },
      (err) => {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Scan failed.");
      },
    );
  }, [params, setArea, setCategoryId, setStatus, setResult, setError]);
}

export function ScanStudio() {
  useUrlSync();
  const { status, result, error, lat, lng, areaLabel, categoryId } =
    useAppStore();
  const [sheetOpen, setSheetOpen] = React.useState(false);

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-2 px-4 py-2.5 md:px-6">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-muted">
              <HugeiconsIcon icon={Search01Icon} size={17} strokeWidth={2} />
            </span>
            <span className="text-lg font-semibold tracking-tight">GapMap</span>
          </div>
          <ScanForm />
          <div className="ml-auto flex items-center gap-1.5">
            <span
              className={cn(
                "rounded-full px-2.5 py-1 font-mono text-[11px]",
                result?.mode === "live"
                  ? "bg-green-500/15 text-green-700 dark:text-green-400"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {result?.mode ?? "mock"}
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-4 md:px-6">
        {status === "idle" && (
          <div className="grid flex-1 gap-4 lg:grid-cols-[1.35fr_1fr]">
            <div className="flex flex-col justify-center rounded-xl border border-border bg-card p-6 md:p-8">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Find what&apos;s missing.
              </h1>
              <p className="mt-2 max-w-md text-muted-foreground">
                Pick an area and a business type above, then scan. GapMap
                reads real Maps, review and search data and tells you — in
                plain words — whether there&apos;s room for something new.
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Tip: click anywhere on the map to move the scan pin.
              </p>
            </div>
            <MapWrapper competitors={[]} />
          </div>
        )}

        {status === "loading" && (
          <div className="flex flex-col gap-3" aria-live="polite">
            <div className="h-64 animate-pulse rounded-xl border border-border bg-muted/40" />
            <p className="text-sm text-muted-foreground">
              Scanning {areaLabel}… reading places, reviews and trends.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
            <p className="font-medium">Scan failed</p>
            <p className="text-muted-foreground">{error ?? "Try again."}</p>
          </div>
        )}

        {status === "success" && result && (
          <div className="grid flex-1 gap-4 lg:grid-cols-[1.35fr_1fr]">
            <MapWrapper competitors={result.competitors} />
            <SignalSummary
              result={result}
              onExplore={() => setSheetOpen(true)}
            />
          </div>
        )}
      </main>

      {result && (
        <EvidenceSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          result={result}
          meta={{ lat, lng, areaLabel, categoryId }}
        />
      )}
    </div>
  );
}
