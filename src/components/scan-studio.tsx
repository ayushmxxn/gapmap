"use client";

import { EvidenceSheet } from "@/components/evidence-sheet";
import { MapWrapper } from "@/components/map-wrapper";
import { SignalSummary } from "@/components/signal-hero";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { UnifiedSearch } from "@/components/unified-search";
import { AREA_PRESETS, resolveCategory } from "@/lib/categories";
import { postScan, scanUrl } from "@/lib/scan-client";
import { useAppStore } from "@/store/app";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import * as React from "react";

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
    (
      targetLat: number,
      targetLng: number,
      catId: string,
      area: string,
      targetScope?: "city" | "neighborhood",
    ) => {
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
        scope: targetScope,
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
    <div className="flex min-h-screen min-h-dvh flex-col bg-background text-foreground">
      {status !== "idle" && (
        <header className="sticky top-0 z-10 bg-white/95 dark:bg-card/95 backdrop-blur-sm pt-[env(safe-area-inset-top,0px)] transition-colors">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => {
                  setStatus("idle");
                  setResult(null);
                  setError(null);
                  setArea(12.9352, 77.6245, "");
                  setCategoryId("");
                  window.history.replaceState(null, "", "/");
                }}
                className="group flex items-center gap-2.5 text-left cursor-pointer transition-opacity hover:opacity-90 shrink-0"
              >
                <Image
                  src="/logo.png"
                  alt="GapMap"
                  width={36}
                  height={22}
                  className="h-5.5 w-auto object-contain select-none transition-transform group-hover:scale-105"
                  priority
                  unoptimized
                />
                <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#111827] dark:text-foreground">
                  GapMap
                </span>
              </button>

              <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground truncate border-l border-border/60 pl-3">
                <span className="font-medium text-foreground truncate max-w-44 md:max-w-xs">
                  {cleanAreaDisplay}
                </span>
                <span className="text-muted-foreground/40">·</span>
                <span className="font-medium text-foreground whitespace-nowrap">
                  {selectedCategory.label}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatus("idle");
                  setResult(null);
                  setError(null);
                  setArea(12.9352, 77.6245, "");
                  setCategoryId("");
                  window.history.replaceState(null, "", "/");
                }}
                className="h-8 px-3 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                New scan
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </header>
      )}

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-between px-4 py-4 md:px-6 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
        {status === "idle" && (
          <div className="flex w-full flex-1 flex-col justify-between">
            {/* Top row directly on hero section page - no separate navbar */}
            <div className="flex w-full items-center justify-between py-2 sm:py-2.5">
              <div className="flex items-center gap-2.5 select-none">
                <Image
                  src="/logo.png"
                  alt="GapMap"
                  width={36}
                  height={22}
                  className="h-5.5 w-auto object-contain select-none"
                  priority
                  unoptimized
                />
                <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#111827] dark:text-foreground">
                  GapMap
                </span>
              </div>

              <ThemeToggle />
            </div>

            <div className="my-auto grid w-full items-center lg:grid-cols-[minmax(0,580px)_minmax(0,1fr)] lg:gap-14 xl:gap-16 pt-5 pb-2 sm:py-6">
            {/* Left Content Column */}
            <div className="flex w-full max-w-[600px] flex-col justify-center">
              <h1 className="text-3xl sm:text-[30px] md:text-[32px] lg:text-[34px] xl:text-[48px] font-semibold tracking-[-0.035em] text-foreground leading-[1.18] text-balance">
                <span>See where your business could work</span>{" "}
                <br className="hidden sm:inline" />
                <span>before you open one.</span>
              </h1>

              <div className="mt-5 sm:mt-8">
                <UnifiedSearch
                  key={`${categoryId}-${areaLabel}`}
                  initialCategoryId={categoryId}
                  initialAreaLabel={areaLabel}
                  initialLat={lat}
                  initialLng={lng}
                  onSearch={({
                    lat: targetLat,
                    lng: targetLng,
                    categoryId: targetCat,
                    areaLabel: targetArea,
                    scope: targetScope,
                  }) => {
                    setArea(targetLat, targetLng, targetArea);
                    setCategoryId(targetCat);
                    runScan(targetLat, targetLng, targetCat, targetArea, targetScope);
                  }}
                />
              </div>
            </div>

            {/* Right Globe Column: Distinct secondary visual with clear separation on mobile */}
            <div className="relative w-full h-[220px] sm:h-[300px] lg:h-[480px] mt-10 sm:mt-12 lg:mt-0">
              <MapWrapper competitors={[]} mode="globe" className="h-full" />
            </div>
          </div>
          </div>
        )}

        {status === "loading" && (
          <div className="flex flex-col gap-6 py-4 sm:py-6" aria-live="polite">
            <div className="relative grid gap-8 lg:grid-cols-[1.1fr_1fr] items-stretch">
              {/* Left Card Skeleton: Mirrors SignalSummary */}
              <div className="flex min-h-[380px] sm:min-h-[440px] lg:min-h-[460px] flex-col justify-between rounded-2xl border border-border/60 bg-card/60 p-6 md:p-8 animate-pulse shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="h-3.5 w-24 rounded bg-muted" />
                    <div className="size-1 rounded-full bg-muted-foreground/30" />
                    <div className="h-3.5 w-16 rounded bg-muted" />
                  </div>
                  <div className="mt-4 h-7 w-3/4 rounded-lg bg-muted" />
                  <div className="mt-2 h-7 w-1/2 rounded-lg bg-muted" />

                  <div className="mt-6 flex items-baseline gap-4">
                    <div className="h-14 w-20 rounded-xl bg-muted" />
                    <div className="h-5 w-28 rounded-md bg-muted" />
                  </div>

                  <div className="mt-6 space-y-2 border-t border-border/40 pt-4">
                    <div className="h-3.5 w-full rounded bg-muted/80" />
                    <div className="h-3.5 w-4/5 rounded bg-muted/80" />
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-3 border-t border-border/40 pt-6">
                  <div className="h-12 rounded-xl bg-muted/60" />
                  <div className="h-12 rounded-xl bg-muted/60" />
                  <div className="h-12 rounded-xl bg-muted/60" />
                </div>
              </div>

              {/* Right Card Skeleton: Mirrors Local Map */}
              <div className="relative flex h-[320px] sm:h-[400px] lg:h-[460px] min-h-[320px] sm:min-h-[400px] lg:min-h-[460px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-muted/20 p-6 animate-pulse shadow-xs">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.08)_0,transparent_70%)]" />
                <div className="size-24 rounded-full border border-primary/20 bg-primary/5" />
                <div className="mt-4 h-3 w-32 rounded-full bg-muted" />
              </div>

              {/* Center Status Badge Overlay */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
                <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-border/80 bg-background/95 px-5 py-3 shadow-lg backdrop-blur-md transition-all">
                  <span className="relative flex size-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
                  </span>
                  <p className="text-xs sm:text-sm font-medium text-foreground">
                    Scanning <span className="font-semibold text-primary">{cleanAreaDisplay}</span> for{" "}
                    <span className="font-semibold">{selectedCategory.label.toLowerCase()}</span> opportunities…
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-6 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground text-sm">
              Scan could not be completed
            </p>
            <p className="mt-1">{error ?? "Please try again."}</p>
          </div>
        )}

        {status === "success" && result && (
          <div className="flex flex-col gap-6" id="gap-result">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] items-stretch">
              <SignalSummary
                result={result}
                onOpenEvidence={() => setSheetOpen(true)}
              />
              <div className="h-[460px] min-h-[460px] w-full">
                <MapWrapper
                  competitors={result.competitors}
                  mode="local"
                  scope={result.scope?.type ?? (result.area.scope ?? "neighborhood")}
                  className="h-full"
                />
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
