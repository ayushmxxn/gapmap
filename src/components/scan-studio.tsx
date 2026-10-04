"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { AREA_PRESETS, CATEGORIES, resolveCategory } from "@/lib/categories";
import { postScan, scanUrl } from "@/lib/scan-client";
import { useAppStore } from "@/store/app";
import { MapWrapper } from "@/components/map-wrapper";
import { SignalSummary } from "@/components/signal-hero";
import { EvidenceSheet } from "@/components/evidence-sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocationSearch } from "@/components/location-search";
import { BusinessSearch } from "@/components/business-search";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    const resolvedCategory = resolveCategory(cat);
    if (!resolvedCategory) return;
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
  const {
    status,
    result,
    error,
    lat,
    lng,
    areaLabel,
    categoryId,
    setArea,
    setCategoryId,
    setStatus,
    setResult,
    setError,
  } = useAppStore();

  const [sheetOpen, setSheetOpen] = React.useState(false);

  const runScan = React.useCallback(
    (targetLat: number, targetLng: number, catId: string, area: string) => {
      setStatus("loading");
      setError(null);
      setResult(null);
      window.history.replaceState(
        null,
        "",
        scanUrl({
          lat: targetLat,
          lng: targetLng,
          categoryId: catId,
          areaLabel: area,
        }),
      );
      postScan({
        lat: targetLat,
        lng: targetLng,
        categoryId: catId,
        areaLabel: area,
      }).then(
        (data) => {
          setResult(data);
          setStatus("success");
        },
        (err) => {
          setStatus("error");
          setError(err instanceof Error ? err.message : "Scan failed.");
        },
      );
    },
    [setStatus, setError, setResult],
  );

  const selectedCategory = resolveCategory(categoryId);
  const cleanAreaDisplay =
    AREA_PRESETS.find((p) => p.label === areaLabel)?.label.split(",")[0] ??
    (areaLabel.includes("pin") || /\d+\.\d+/.test(areaLabel)
      ? "Selected location"
      : areaLabel.split(",")[0]);

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-2.5 md:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (status !== "idle") {
                  setStatus("idle");
                  setResult(null);
                  setError(null);
                  window.history.replaceState(null, "", "/");
                }
              }}
              className="flex items-center gap-2 text-left cursor-pointer transition-opacity hover:opacity-80 shrink-0"
            >
              <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-muted">
                <HugeiconsIcon icon={Search01Icon} size={17} strokeWidth={2} />
              </span>
              <span className="text-lg font-semibold tracking-tight">GapMap</span>
            </button>

            {status !== "idle" && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground truncate border-l border-border pl-3">
                <span className="font-medium text-foreground truncate max-w-44 md:max-w-xs">
                  {cleanAreaDisplay}
                </span>
                <span className="opacity-40">·</span>
                <span className="font-medium text-foreground whitespace-nowrap">
                  {selectedCategory.label}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {status !== "idle" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatus("idle");
                  setResult(null);
                  setError(null);
                  window.history.replaceState(null, "", "/");
                }}
                className="cursor-pointer text-xs font-medium"
              >
                New scan
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 md:px-6">
        {status === "idle" && (
          <div className="grid flex-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="flex flex-col justify-center rounded-xl border border-border bg-card p-6 md:p-8 shadow-xs">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Find what&apos;s missing.
              </h1>
              <p className="mt-2 text-sm text-muted-foreground md:text-base leading-relaxed">
                See where a business could work before you open one.
              </p>

              <div className="mt-8 flex flex-col gap-6">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Where do you want to look?
                  </label>
                  <LocationSearch
                    value={areaLabel}
                    onSelect={(newLat, newLng, label) =>
                      setArea(newLat, newLng, label)
                    }
                    placeholder="Search a city, neighborhood, or address"
                    className="mt-2.5 w-full"
                  />
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-muted-foreground mr-1">Popular places:</span>
                    {AREA_PRESETS.map((p) => {
                      const isSelected = areaLabel === p.label;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setArea(p.lat, p.lng, p.label)}
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-muted/40 text-foreground hover:bg-muted",
                          )}
                        >
                          {p.label.split(",")[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    What do you want to open?
                  </label>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {CATEGORIES.map((c) => {
                      const isSelected =
                        selectedCategory.id === c.id ||
                        categoryId.toLowerCase() === c.id.toLowerCase();
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setCategoryId(c.id)}
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-muted/40 text-foreground hover:bg-muted",
                          )}
                        >
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                  <BusinessSearch
                    value={categoryId}
                    onSelect={(cat) => setCategoryId(cat)}
                    placeholder="Search for another business"
                    className="mt-2.5 w-full"
                  />
                </div>

                <div className="pt-1">
                  <Button
                    type="button"
                    size="lg"
                    className="w-full sm:w-auto font-medium cursor-pointer"
                    onClick={() =>
                      runScan(lat, lng, categoryId, areaLabel)
                    }
                  >
                    Find opportunities →
                  </Button>
                </div>
              </div>
            </div>

            <div className="min-h-[360px] overflow-hidden rounded-xl border border-border">
              <MapWrapper competitors={[]} mode="globe" />
            </div>
          </div>
        )}

        {status === "loading" && (
          <div className="flex flex-col gap-4" aria-live="polite">
            <div className="h-72 animate-pulse rounded-xl border border-border bg-muted/40" />
            <p className="text-sm text-muted-foreground">
              Scanning {cleanAreaDisplay} for {selectedCategory.label.toLowerCase()} opportunities…
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-5 text-sm">
            <p className="font-semibold text-destructive">Scan failed</p>
            <p className="mt-1 text-muted-foreground">{error ?? "Please try again."}</p>
          </div>
        )}

        {status === "success" && result && (
          <div className="flex flex-col gap-6" id="gap-result">
            <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
              <SignalSummary
                result={result}
                onOpenEvidence={() => setSheetOpen(true)}
              />
              <div className="min-h-[420px] overflow-hidden rounded-xl border border-border">
                <MapWrapper competitors={result.competitors} mode="local" />
              </div>
            </div>
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
