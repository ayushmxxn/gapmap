"use client";

import dynamic from "next/dynamic";
import { MapWrapper } from "@/components/map-wrapper";
import { SignalSummary } from "@/components/signal-hero";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { UnifiedSearch } from "@/components/unified-search";
import { resolveCategory } from "@/lib/categories";
import { AREA_PRESETS } from "@/lib/places";
import { postScan, scanUrl } from "@/lib/scan-client";
import { playSound } from "@/lib/sound";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import * as React from "react";

const EvidenceSheet = dynamic(
  () => import("@/components/evidence-sheet").then((m) => m.EvidenceSheet),
  { ssr: false },
);

// Runs a scan on first load when coordinates and category are passed in the URL.
function useUrlSync() {
  const params = useSearchParams();
  const lastKey = React.useRef<string | null>(null);
  const setArea = useAppStore((s) => s.setArea);
  const setCategoryId = useAppStore((s) => s.setCategoryId);
  const setStatus = useAppStore((s) => s.setStatus);
  const setResult = useAppStore((s) => s.setResult);
  const setError = useAppStore((s) => s.setError);

  React.useEffect(() => {
    const rawLat = params.get("lat");
    const rawLng = params.get("lng");
    const cat = params.get("cat");
    const area = params.get("area");
    if (!cat || !area || rawLat === null || rawLng === null) return;

    const lat = Number(rawLat);
    const lng = Number(rawLng);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      setStatus("error");
      setError("Invalid location coordinates in link. Please select a valid location.");
      return;
    }

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
  const status = useAppStore((s) => s.status);
  const result = useAppStore((s) => s.result);
  const error = useAppStore((s) => s.error);
  const lat = useAppStore((s) => s.lat);
  const lng = useAppStore((s) => s.lng);
  const areaLabel = useAppStore((s) => s.areaLabel);
  const categoryId = useAppStore((s) => s.categoryId);
  const setArea = useAppStore((s) => s.setArea);
  const setCategoryId = useAppStore((s) => s.setCategoryId);
  const setStatus = useAppStore((s) => s.setStatus);
  const setResult = useAppStore((s) => s.setResult);
  const setError = useAppStore((s) => s.setError);

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
      playSound("loading", { volume: 0.3 });
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
          playSound("success", { emphasis: "strong", volume: 0.85 });
        },
        (err) => {
          setStatus("error");
          setError(err instanceof Error ? err.message : "Scan failed.");
          playSound("error", { volume: 0.5 });
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
      {status !== "idle" && (
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pt-[env(safe-area-inset-top,0px)] border-b border-border/40">
          <div className="mx-auto flex w-full max-w-7xl xl:max-w-[1380px] 2xl:max-w-[1440px] items-center justify-between gap-3 px-4 py-2.5 sm:py-3 md:px-6 lg:px-8 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                data-cuelume-navigate
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
                  alt="GapMap - Commercial gap analysis and market feasibility scanner"
                  width={36}
                  height={22}
                  style={{ width: "auto" }}
                  className="h-5.5 w-auto object-contain select-none transition-transform group-hover:scale-105"
                  priority
                  unoptimized
                />
                <span className="text-[15px] font-semibold tracking-[-0.02em] text-foreground">
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

            <div className="flex items-center gap-2.5 shrink-0">
              <ThemeToggle />
              <Button
                type="button"
                data-cuelume-tap
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
                className="h-8.5 rounded-lg px-3.5 text-xs font-medium cursor-pointer border-0 shadow-none bg-muted hover:bg-muted/80 text-foreground active:scale-[0.98]"
              >
                New scan
              </Button>
            </div>
          </div>
        </header>
      )}

      <main
        className={cn(
          "mx-auto flex w-full flex-1 flex-col px-4 md:px-6 lg:px-8 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pb-[max(1rem,env(safe-area-inset-bottom,0px))]",
          status === "idle" ? "max-w-6xl" : "max-w-7xl xl:max-w-[1380px] 2xl:max-w-[1440px]",
        )}
      >
        {status === "idle" && (
          <div className="flex w-full flex-1 flex-col justify-between py-4">
            <div className="flex w-full items-center justify-between py-2 sm:py-2.5">
              <div className="flex items-center gap-2.5 select-none">
                <Image
                  src="/logo.png"
                  alt="GapMap - Commercial gap analysis and market feasibility scanner"
                  width={36}
                  height={22}
                  style={{ width: "auto" }}
                  className="h-5.5 w-auto object-contain select-none"
                  priority
                  unoptimized
                />
                <span className="text-[15px] font-semibold tracking-[-0.02em] text-foreground">
                  GapMap
                </span>
              </div>

              <ThemeToggle />
            </div>

            <div className="my-auto grid w-full items-center lg:grid-cols-[minmax(0,580px)_minmax(0,1fr)] lg:gap-14 xl:gap-16 pt-10 pb-3 sm:py-6">
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

            <div className="relative w-full h-[220px] sm:h-[300px] lg:h-[480px] mt-10 sm:mt-12 lg:mt-0">
              <MapWrapper competitors={[]} mode="globe" className="h-full" />
            </div>
          </div>
          </div>
        )}

        {status === "loading" && (
          <div className="w-full pt-2 sm:pt-3 lg:pt-3.5 pb-4 sm:pb-6" aria-live="polite">
            <div className="sr-only" role="status">
              Analyzing neighborhood market, competition, and search demand…
            </div>
            <div className="grid gap-5 lg:gap-6 xl:gap-7 lg:grid-cols-[1fr_1.2fr] items-stretch w-full lg:h-[clamp(440px,calc(100dvh-6.5rem),520px)]">
              <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 sm:p-7 xl:p-8 shadow-xs animate-pulse">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="h-3.5 w-28 rounded bg-muted" />
                    <div className="size-1 rounded-full bg-muted-foreground/30" />
                    <div className="h-3.5 w-16 rounded bg-muted" />
                  </div>

                  <div className="mt-4 sm:mt-5 flex items-baseline gap-3.5">
                    <div className="h-14 sm:h-16 w-24 rounded-xl bg-muted" />
                    <div className="h-6 w-28 rounded-full bg-muted" />
                  </div>

                  <div className="mt-3 sm:mt-4 space-y-2">
                    <div className="h-3.5 w-11/12 rounded bg-muted" />
                    <div className="h-3.5 w-3/4 rounded bg-muted" />
                  </div>

                  <div className="mt-4.5 pt-3.5 sm:mt-5 sm:pt-4 border-t border-border/60">
                    <div className="grid grid-cols-3 gap-3 sm:gap-4">
                      <div className="space-y-1.5">
                        <div className="h-2.5 w-12 rounded bg-muted" />
                        <div className="h-4 w-16 rounded bg-muted" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-2.5 w-14 rounded bg-muted" />
                        <div className="h-4 w-16 rounded bg-muted" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-2.5 w-16 rounded bg-muted" />
                        <div className="h-4 w-14 rounded bg-muted" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4.5 pt-3.5 sm:mt-5 sm:pt-4 border-t border-border/60 flex items-center justify-between">
                  <div className="h-3.5 w-44 rounded bg-muted" />
                  <div className="h-8 w-28 rounded-lg bg-muted" />
                </div>
              </div>

              <div className="relative flex min-h-[340px] sm:min-h-[380px] lg:min-h-0 h-full w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-xs animate-pulse">
                <div className="relative flex items-center justify-center">
                  <div className="size-36 rounded-full border border-border bg-muted/70" />
                  <div className="absolute size-20 rounded-full border border-border bg-muted/80" />
                  <div className="absolute size-8 rounded-full bg-muted-foreground/30" />
                </div>
                <div className="mt-5 h-3 w-28 rounded-full bg-muted" />
              </div>
            </div>
          </div>
        )}

        {status === "error" && (
          <div role="alert" aria-live="assertive" className="w-full max-w-lg mx-auto my-12 rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs text-center animate-in fade-in-0 duration-200">
            <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 mb-3.5">
              <span className="size-2.5 rounded-full bg-rose-500 shadow-[0_0_0_4px_rgba(244,63,94,0.18)]" />
            </div>

            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
              Scan could not be completed
            </h2>

            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
              {error ?? "We were unable to analyze this market right now. Please check your connection and try again."}
            </p>

            <div className="mt-5 sm:mt-6 flex flex-wrap items-center justify-center gap-2.5">
              <Button
                type="button"
                data-cuelume-tap
                onClick={() => {
                  if (lat && lng && categoryId && areaLabel) {
                    runScan(lat, lng, categoryId, areaLabel);
                  } else {
                    setStatus("idle");
                    setError(null);
                  }
                }}
                className="h-9 px-4 rounded-xl text-xs font-medium cursor-pointer shadow-xs active:scale-[0.98] transition-transform"
              >
                Try again
              </Button>

              <Button
                type="button"
                data-cuelume-tap
                variant="outline"
                onClick={() => {
                  setStatus("idle");
                  setError(null);
                  setResult(null);
                  setArea(12.9352, 77.6245, "");
                  setCategoryId("");
                  window.history.replaceState(null, "", "/");
                }}
                className="h-9 px-4 rounded-xl text-xs font-medium cursor-pointer border-border hover:bg-muted text-foreground active:scale-[0.98] transition-transform"
              >
                Change search
              </Button>
            </div>
          </div>
        )}

        {status === "success" && result && (
          <div className="w-full pt-2 sm:pt-3 lg:pt-3.5 pb-4 sm:pb-6" id="gap-result">
            <div className="sr-only" role="status" aria-live="polite">
              Market scan completed. Opportunity score is {result.gapSignal.score} out of 100 with a {result.gapSignal.verdict} verdict.
            </div>
            <div className="grid gap-5 lg:gap-6 xl:gap-7 lg:grid-cols-[1fr_1.2fr] items-stretch w-full lg:h-[clamp(440px,calc(100dvh-6.5rem),520px)]">
              <SignalSummary
                result={result}
                onOpenEvidence={() => setSheetOpen(true)}
              />
              <div className="w-full min-h-[340px] sm:min-h-[380px] lg:min-h-0 h-full">
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
