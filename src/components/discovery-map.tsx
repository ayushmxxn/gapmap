"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import Map, { Marker, Popup, Source, Layer, type MapRef } from "react-map-gl/mapbox";
import { HugeiconsIcon } from "@hugeicons/react";
import { GlobalIcon } from "@hugeicons/core-free-icons";
import { circle } from "@turf/turf";
import {
  getMapboxToken,
  isMapboxConfigured,
  MAPBOX_STYLE,
} from "@/lib/mapbox";
import { SCAN_RADIUS_KM } from "@/lib/geo";
import { AREA_PRESETS } from "@/lib/places";
import { useAppStore } from "@/store/app";
import type { Competitor } from "@/lib/scoring";
import { formatReviewCount } from "@/lib/result-utils";
import { reverseGeocode } from "@/lib/mapbox-geocoding";

import { getOptimalGlobeZoom, competitorKey, pinColor } from "@/lib/map-utils";
import { CompetitorMarker } from "@/components/competitor-marker";

type Projection = "globe" | "mercator";

const INDIA_CENTER: [number, number] = [78.9629, 22.5937];
const LOCAL_ZOOM = 14;
/** Above this zoom we render flat; below it we render the globe. */
const FLAT_ZOOM = 9;
const ROUND_ZOOM = 5;

interface GlobeCapableMap {
  setProjection?: (name: string) => void;
  setFog?: (fog: Record<string, string | number>) => void;
  setConfigProperty?: (
    scope: string,
    name: string,
    value: unknown,
  ) => void;
}

/** Clean satellite globe: full daylight first, labels/roads hidden
 *  so Earth is the focus. Unknown keys are ignored via try/catch. */
const SATELLITE_CONFIG: [string, unknown][] = [
  ["lightPreset", "day"],
  ["showRoadsAndTransit", false],
  ["showPedestrianRoads", false],
  ["showPlaceLabels", false],
  ["showPointOfInterestLabels", false],
  ["showRoadLabels", false],
  ["showTransitLabels", false],
  ["showAdminBoundaries", false],
];

export function DiscoveryMap({
  competitors,
  mode = "globe",
  scope = "neighborhood",
}: {
  competitors: Competitor[];
  mode?: "globe" | "local";
  scope?: "city" | "neighborhood";
}) {
  const isLocal = mode === "local";
  const { lat, lng, setArea } = useAppStore();
  const { resolvedTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const mapRef = React.useRef<MapRef>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [globeProjection, setGlobeProjection] = React.useState<Projection>("globe");
  const projection = isLocal ? "mercator" : globeProjection;
  const projRef = React.useRef<Projection>(projection);
  const hasInteractedRef = React.useRef(false);
  const firstArea = React.useRef(true);
  const projectionTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    projRef.current = projection;
  }, [projection]);

  const [selected, setSelected] = React.useState<Competitor | null>(null);
  const handleSelectCompetitor = React.useCallback((c: Competitor) => {
    setSelected(c);
  }, []);

  React.useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelected(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  // Measurement states for reliable mounting
  const [dimensions, setDimensions] = React.useState<{ width: number; height: number } | null>(null);
  const [mapError, setMapError] = React.useState(false);

  const isDark = mounted && resolvedTheme === "dark";
  const mapStyle = MAPBOX_STYLE;
  const isValidCenter =
    Number.isFinite(lat) &&
    lat >= -90 &&
    lat <= 90 &&
    Number.isFinite(lng) &&
    lng >= -180 &&
    lng <= 180;
  const safeLat = isValidCenter ? lat : INDIA_CENTER[1];
  const safeLng = isValidCenter ? lng : INDIA_CENTER[0];

  const radiusGeoJson = React.useMemo(
    () =>
      circle([safeLng, safeLat], SCAN_RADIUS_KM, {
        units: "kilometers",
        steps: 64,
      }),
    [safeLat, safeLng],
  );

  const applySettings = React.useCallback(
    (dark: boolean) => {
      const map = mapRef.current?.getMap() as unknown as
        | GlobeCapableMap
        | undefined;
      if (!map) return;
      if (projRef.current === "globe") {
        map.setProjection?.("globe");
        for (const [name, value] of SATELLITE_CONFIG) {
          try {
            map.setConfigProperty?.("basemap", name, value);
          } catch {
            /* style without this config; ignore */
          }
        }
        const spaceBg = dark ? "#191b19" : "#ffffff";
        /* Clean globe boundary with zero blue atmospheric halo/glow */
        map.setFog?.({
          color: spaceBg,
          "high-color": spaceBg,
          "horizon-blend": 0,
          "space-color": spaceBg,
          "star-intensity": 0,
        });
      } else {
        map.setProjection?.("mercator");
        map.setFog?.({});
      }
    },
    [],
  );

  const handleMove = React.useCallback(
    (e: { target: { getZoom: () => number; isStyleLoaded?: () => boolean } & GlobeCapableMap }) => {
      if (isLocal) return;
      const z = e.target.getZoom();
      const rawMap = e.target;
      const nextProj: Projection | null =
        z >= FLAT_ZOOM && projRef.current !== "mercator"
          ? "mercator"
          : z <= ROUND_ZOOM && projRef.current !== "globe"
            ? "globe"
            : null;
      if (!nextProj) return;
      if (projectionTimerRef.current) clearTimeout(projectionTimerRef.current);
      projectionTimerRef.current = setTimeout(() => {
        if (!rawMap.isStyleLoaded?.()) return;
        projRef.current = nextProj;
        setGlobeProjection(nextProj);
        rawMap.setProjection?.(nextProj);
      }, 150);
    },
    [isLocal],
  );

  /* Re-apply projection + atmosphere whenever the style reloads
     (mount, theme toggle). */
  React.useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    let cancelled = false;
    const onStyleLoad = () => {
      if (!cancelled) applySettings(isDark);
    };
    if (map.isStyleLoaded()) {
      applySettings(isDark);
    } else {
      map.once("style.load", onStyleLoad);
    }
    return () => {
      cancelled = true;
      (map as unknown as { off?: (event: string, fn: () => void) => void }).off?.(
        "style.load",
        onStyleLoad,
      );
    };
  }, [mapStyle, isDark, applySettings]);

  /* Measure container dimensions before rendering Map and handle resize/orientation */
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let rafId: number | null = null;
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    let secondTimer: ReturnType<typeof setTimeout> | null = null;

    const performMeasurement = () => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      if (w > 0 && h > 0) {
        setDimensions((prev) => {
          if (prev && Math.abs(prev.width - w) < 1 && Math.abs(prev.height - h) < 1) {
            return prev;
          }
          return { width: w, height: h };
        });

        const map = mapRef.current?.getMap();
        if (map) {
          map.resize();
          if (!isLocal && projRef.current === "globe" && !hasInteractedRef.current) {
            const optimalZoom = getOptimalGlobeZoom(w, h, 0.70);
            map.jumpTo({
              center: INDIA_CENTER,
              zoom: optimalZoom,
            });
          }
        }
      }
    };

    const updateMapDimensions = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(performMeasurement);
    };

    performMeasurement();

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          updateMapDimensions();
        }
      }
    });
    observer.observe(el);

    const onOrientationChange = () => {
      updateMapDimensions();
      if (resizeTimer) clearTimeout(resizeTimer);
      if (secondTimer) clearTimeout(secondTimer);
      resizeTimer = setTimeout(updateMapDimensions, 150);
      secondTimer = setTimeout(updateMapDimensions, 350);
    };

    window.addEventListener("orientationchange", onOrientationChange);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      observer.disconnect();
      if (resizeTimer) clearTimeout(resizeTimer);
      if (secondTimer) clearTimeout(secondTimer);
      window.removeEventListener("orientationchange", onOrientationChange);
      if (projectionTimerRef.current) clearTimeout(projectionTimerRef.current);
    };
  }, [isLocal]);

  /* Position map camera for local/city scan or fly globe when area is chosen. */
  const lastCameraTargetRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    const targetKey = `${isLocal ? "local" : "globe"}-${scope}-${lat.toFixed(4)}-${lng.toFixed(4)}-${competitors.length}`;
    if (lastCameraTargetRef.current === targetKey) return;
    lastCameraTargetRef.current = targetKey;

    if (isLocal) {
      const map = mapRef.current?.getMap() as unknown as
        | {
            flyTo: (opts: Record<string, unknown>) => void;
            fitBounds: (
              bounds: [[number, number], [number, number]],
              opts?: Record<string, unknown>,
            ) => void;
          }
        | undefined;

      if (!map) return;

      if (scope === "city") {
        const validCoords = competitors.filter(
          (c) => typeof c.lat === "number" && typeof c.lng === "number",
        );
        if (validCoords.length > 1) {
          let minLng = Infinity,
            maxLng = -Infinity;
          let minLat = Infinity,
            maxLat = -Infinity;
          for (const c of validCoords) {
            if (c.lng! < minLng) minLng = c.lng!;
            if (c.lng! > maxLng) maxLng = c.lng!;
            if (c.lat! < minLat) minLat = c.lat!;
            if (c.lat! > maxLat) maxLat = c.lat!;
          }
          map.fitBounds(
            [
              [minLng, minLat],
              [maxLng, maxLat],
            ],
            {
              padding: { top: 60, bottom: 60, left: 60, right: 60 },
              maxZoom: 14,
              duration: 1500,
              essential: true,
            },
          );
          return;
        }

        map.flyTo({
          center: [lng, lat],
          zoom: 11.8,
          duration: 1500,
          essential: true,
        });
        return;
      }

      map?.flyTo({
        center: [lng, lat],
        zoom: 13.5,
        duration: 1500,
        essential: true,
      });
      return;
    }
    if (firstArea.current) {
      firstArea.current = false;
      return;
    }
    hasInteractedRef.current = true;
    const map = mapRef.current?.getMap() as unknown as
      | { flyTo: (opts: Record<string, unknown>) => void }
      | undefined;
    map?.flyTo({
      center: [lng, lat],
      zoom: LOCAL_ZOOM,
      duration: 4500,
      curve: 1.42,
      essential: true,
    });
  }, [lat, lng, isLocal, scope, competitors]);

  if (!isMapboxConfigured()) {
    return (
      <div className="flex h-full min-h-72 items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
        Map preview needs a Mapbox token.
        <br />
        Set NEXT_PUBLIC_MAPBOX_TOKEN to enable the map.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full min-h-0 overflow-hidden"
    >
      {/* 1. Only mount Map once container has measured dimensions */}
      {dimensions && dimensions.width > 0 && dimensions.height > 0 && !mapError ? (
        <Map
          ref={mapRef}
          mapboxAccessToken={getMapboxToken()}
          initialViewState={{
            longitude: isLocal ? safeLng : INDIA_CENTER[0],
            latitude: isLocal ? safeLat : INDIA_CENTER[1],
            zoom: isLocal
              ? scope === "city"
                ? 11.8
                : 13.5
              : getOptimalGlobeZoom(dimensions.width, dimensions.height, 0.70),
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle={mapStyle}
          cooperativeGestures={false}
          scrollZoom={true}
          dragPan={true}
          dragRotate={true}
          doubleClickZoom={true}
          touchZoomRotate={true}
          touchPitch={true}
          boxZoom={false}
          keyboard={true}
          onError={() => setMapError(true)}
          onLoad={() => {
            applySettings(isDark);
            const map = mapRef.current?.getMap();
            if (map) {
              const handlers = (
                map as unknown as {
                  handlers?: {
                    _handlersById?: {
                      mouseRotate?: {
                        _correctButton?: (e: MouseEvent, button: number) => boolean;
                      };
                      mousePitch?: {
                        _correctButton?: (e: MouseEvent, button: number) => boolean;
                      };
                    };
                  };
                }
              ).handlers?._handlersById;

              if (handlers?.mouseRotate) {
                handlers.mouseRotate._correctButton = (e: MouseEvent, button: number) =>
                  (button === 0 && (e.ctrlKey || e.shiftKey)) || button === 2;
              }
              if (handlers?.mousePitch) {
                handlers.mousePitch._correctButton = (e: MouseEvent, button: number) =>
                  (button === 0 && (e.ctrlKey || e.shiftKey)) || button === 2;
              }

              if (!isLocal && !hasInteractedRef.current && dimensions) {
                const optimalZoom = getOptimalGlobeZoom(
                  dimensions.width,
                  dimensions.height,
                  0.70,
                );
                map.jumpTo({
                  center: INDIA_CENTER,
                  zoom: optimalZoom,
                });
              }

              if (isLocal && scope === "city" && competitors.length > 1) {
                const validCoords = competitors.filter(
                  (c) => typeof c.lat === "number" && typeof c.lng === "number",
                );
                if (validCoords.length > 1) {
                  let minLng = Infinity,
                    maxLng = -Infinity;
                  let minLat = Infinity,
                    maxLat = -Infinity;
                  for (const c of validCoords) {
                    if (c.lng! < minLng) minLng = c.lng!;
                    if (c.lng! > maxLng) maxLng = c.lng!;
                    if (c.lat! < minLat) minLat = c.lat!;
                    if (c.lat! > maxLat) maxLat = c.lat!;
                  }
                  (map as unknown as { fitBounds: (bounds: [[number, number], [number, number]], opts?: Record<string, unknown>) => void }).fitBounds(
                    [
                      [minLng, minLat],
                      [maxLng, maxLat],
                    ],
                    {
                      padding: { top: 60, bottom: 60, left: 60, right: 60 },
                      maxZoom: 14,
                      duration: 0,
                    },
                  );
                }
              }
            }
          }}
          onDragStart={() => {
            hasInteractedRef.current = true;
          }}
          onZoomStart={() => {
            hasInteractedRef.current = true;
          }}
          onPitchStart={() => {
            hasInteractedRef.current = true;
          }}
          onRotateStart={() => {
            hasInteractedRef.current = true;
          }}
          onMove={handleMove}
          onClick={async (e) => {
            hasInteractedRef.current = true;
            const clickLat = Number(e.lngLat.lat.toFixed(4));
            const clickLng = Number(e.lngLat.lng.toFixed(4));
            const label = await reverseGeocode(clickLat, clickLng);
            setArea(clickLat, clickLng, label);
          }}
        >
          {scope !== "city" && (
            <Source id="scan-radius" type="geojson" data={radiusGeoJson}>
              <Layer
                id="scan-radius-fill"
                type="fill"
                paint={{ "fill-color": "#2563eb", "fill-opacity": 0.08 }}
              />
              <Layer
                id="scan-radius-line"
                type="line"
                paint={{ "line-color": "#2563eb", "line-width": 1.5 }}
              />
            </Source>
          )}

          {!isLocal &&
            projection === "globe" &&
            AREA_PRESETS.map((p) => (
              <Marker
                key={p.id}
                longitude={p.lng}
                latitude={p.lat}
                anchor="center"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  hasInteractedRef.current = true;
                  setArea(p.lat, p.lng, p.label);
                }}
              >
                <button
                  type="button"
                  aria-label={`Select location preset: ${p.label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    hasInteractedRef.current = true;
                    setArea(p.lat, p.lng, p.label);
                  }}
                  className="flex cursor-pointer flex-col items-center gap-1 bg-transparent border-0 p-0 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:rounded-full"
                >
                  <span className="block size-2.5 rounded-full bg-primary ring-4 ring-primary/20 transition-transform hover:scale-125" />
                  <span className="rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap text-foreground backdrop-blur">
                    {p.label.split(",")[0]}
                  </span>
                </button>
              </Marker>
            ))}

          {isValidCenter && (
            <Marker longitude={safeLng} latitude={safeLat} anchor="center">
              <span className="block size-3 rounded-full bg-blue-600 ring-4 ring-blue-600/20" />
            </Marker>
          )}

          {competitors.map(
            (c) =>
              c.lat != null &&
              c.lng != null && (
                <CompetitorMarker
                  key={competitorKey(c)}
                  competitor={c}
                  isSelected={Boolean(
                    selected && competitorKey(selected) === competitorKey(c),
                  )}
                  onSelect={handleSelectCompetitor}
                />
              ),
          )}

          {selected && selected.lat != null && selected.lng != null && (
            <Popup
              longitude={selected.lng}
              latitude={selected.lat}
              offset={12}
              maxWidth="240px"
              className="gapmap-popup"
              onClose={() => setSelected(null)}
            >
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-semibold tracking-tight text-foreground truncate">
                  {selected.title.split("|")[0]?.trim() ?? selected.title}
                </p>
                <p className="text-xs">
                  <span
                    className="font-medium"
                    style={{ color: pinColor(selected.rating) }}
                  >
                    {selected.rating != null
                      ? `${selected.rating.toFixed(1)}★`
                      : "Unrated"}
                  </span>
                  {selected.reviews != null && (
                    <span className="text-muted-foreground">
                      {" "}
                      · {formatReviewCount(selected.reviews)} reviews
                    </span>
                  )}
                </p>
                {selected.address && (
                  <p className="text-[11px] text-muted-foreground line-clamp-1">
                    {selected.address}
                  </p>
                )}
              </div>
            </Popup>
          )}
        </Map>
      ) : mapError ? (
        <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-xs text-muted-foreground bg-muted/20 rounded-2xl border border-border/40">
          <p className="font-medium text-foreground">Map preview unavailable</p>
          <p className="mt-1 max-w-xs text-muted-foreground/80">
            Opportunity scanner and analytics remain fully operational.
          </p>
          <button
            type="button"
            data-cuelume-tap
            onClick={() => setMapError(false)}
            className="mt-3 rounded-lg px-3 py-1.5 text-xs font-medium bg-background border border-border text-foreground hover:bg-muted cursor-pointer transition-colors shadow-xs active:scale-[0.98]"
          >
            Retry map
          </button>
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-2xl bg-muted/20 text-xs text-muted-foreground/70">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500/80 animate-pulse" />
            <span>Loading map…</span>
          </div>
        </div>
      )}

      {!isLocal && projection === "mercator" && (
        <button
          type="button"
          aria-label="Switch projection to globe view"
          onClick={() => {
            const map = mapRef.current?.getMap() as unknown as
              | {
                  flyTo: (opts: Record<string, unknown>) => void;
                  getCanvas: () => HTMLCanvasElement;
                }
              | undefined;
            const canvas = map?.getCanvas?.();
            const optimalZoom = canvas
              ? getOptimalGlobeZoom(canvas.clientWidth, canvas.clientHeight, 0.70)
              : 1.35;
            hasInteractedRef.current = false;
            map?.flyTo({
              center: [...INDIA_CENTER],
              zoom: optimalZoom,
              duration: 2500,
              essential: true,
            });
          }}
          className="absolute top-3 right-3 flex items-center gap-1.5 rounded-md border border-border bg-background/90 px-2.5 py-1.5 text-xs font-medium shadow backdrop-blur hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <HugeiconsIcon icon={GlobalIcon} size={14} strokeWidth={2} />
          <span>Globe</span>
        </button>
      )}
    </div>
  );
}
