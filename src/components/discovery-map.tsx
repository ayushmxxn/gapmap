"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import Map, { Marker, Popup, Source, Layer, type MapRef } from "react-map-gl/mapbox";
import { HugeiconsIcon } from "@hugeicons/react";
import { GlobalIcon } from "@hugeicons/core-free-icons";
import { circle } from "@turf/turf";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  getMapboxToken,
  isMapboxConfigured,
  MAPBOX_SATELLITE,
  MAPBOX_STYLE,
  MAPBOX_STYLE_DARK,
} from "@/lib/mapbox";
import { SCAN_RADIUS_KM } from "@/lib/geo";
import { AREA_PRESETS } from "@/lib/categories";
import { useAppStore } from "@/store/app";
import type { Competitor } from "@/lib/scoring";
import { cn } from "@/lib/utils";

type Projection = "globe" | "mercator";

const INDIA_CENTER: [number, number] = [78.9629, 22.5937];
const GLOBE_ZOOM = 1.8;
const LOCAL_ZOOM = 14;
/** Above this zoom we render flat; below it we render the globe. */
const FLAT_ZOOM = 9;
const ROUND_ZOOM = 5;

function pinColor(rating: number | undefined): string {
  if (rating == null) return "#71717a";
  if (rating >= 4.3) return "#16a34a";
  if (rating >= 3.7) return "#d97706";
  return "#dc2626";
}

function competitorKey(c: Competitor): string {
  return `${c.title}-${c.lat}-${c.lng}`;
}

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
}: {
  competitors: Competitor[];
}) {
  const { lat, lng, areaLabel, setArea } = useAppStore();
  const { resolvedTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const mapRef = React.useRef<MapRef>(null);
  const projRef = React.useRef<Projection>("globe");
  const [projection, setProjectionState] = React.useState<Projection>("globe");
  const [selected, setSelected] = React.useState<Competitor | null>(null);
  const spinRef = React.useRef(true);
  const resumeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstArea = React.useRef(true);

  const isDark = mounted && resolvedTheme === "dark";
  /* Satellite Earth for globe discovery; detailed streets for local analysis. */
  const mapStyle =
    projection === "globe"
      ? MAPBOX_SATELLITE
      : isDark
        ? MAPBOX_STYLE_DARK
        : MAPBOX_STYLE;

  const radiusGeoJson = React.useMemo(
    () =>
      circle([lng, lat], SCAN_RADIUS_KM, {
        units: "kilometers",
        steps: 64,
      }),
    [lat, lng],
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
        /* Dark navy space + subtle stars; rim kept to a whisper. */
        map.setFog?.(
          dark
            ? {
                color: "#060a18",
                "high-color": "#060a18",
                "horizon-blend": 0.05,
                "space-color": "#02040c",
                "star-intensity": 0.45,
              }
            : {
                color: "#0a1020",
                "high-color": "#0a1020",
                "horizon-blend": 0.05,
                "space-color": "#04060e",
                "star-intensity": 0.35,
              },
        );
      } else {
        map.setProjection?.("mercator");
        map.setFog?.(
          dark
            ? {
                color: "#0b0b19",
                "high-color": "#1e40af",
                "horizon-blend": 0.12,
                "space-color": "#040409",
                "star-intensity": 0.55,
              }
            : {
                color: "rgb(186, 210, 235)",
                "high-color": "rgb(36, 92, 223)",
                "horizon-blend": 0.08,
                "space-color": "rgb(232, 238, 245)",
                "star-intensity": 0,
              },
        );
      }
    },
    [],
  );

  /* Re-apply projection + atmosphere whenever the style reloads
     (mount, theme toggle). */
  React.useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    let cancelled = false;
    if (map.isStyleLoaded()) {
      applySettings(isDark);
    } else {
      map.once("style.load", () => {
        if (!cancelled) applySettings(isDark);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [mapStyle, isDark, applySettings]);

  /* Slow idle spin on the globe. Pauses on interaction, stops on selection. */
  React.useEffect(() => {
    let raf = 0;
    let last = 0;
    const tick = (t: number) => {
      const map = mapRef.current?.getMap() as unknown as
        | { getCenter: () => { lng: number }; setCenter: (c: { lng: number }) => void }
        | undefined;
      if (map && spinRef.current && t - last > 60) {
        last = t;
        try {
          const c = map.getCenter();
          map.setCenter({ lng: c.lng - 0.05 });
        } catch {
          /* map tearing down; ignore */
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const pauseSpin = React.useCallback(() => {
    spinRef.current = false;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      if (projRef.current === "globe") spinRef.current = true;
    }, 6000);
  }, []);

  /* Fly globe → country → city → neighbourhood when an area is chosen. */
  React.useEffect(() => {
    if (firstArea.current) {
      firstArea.current = false;
      return;
    }
    const map = mapRef.current?.getMap() as unknown as
      | { flyTo: (opts: Record<string, unknown>) => void }
      | undefined;
    spinRef.current = false;
    map?.flyTo({
      center: [lng, lat],
      zoom: LOCAL_ZOOM,
      duration: 4500,
      curve: 1.42,
      essential: true,
    });
  }, [lat, lng]);

  React.useEffect(
    () => () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    },
    [],
  );

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
    <div className="relative h-full min-h-[320px] w-full">
      <Map
        ref={mapRef}
        mapboxAccessToken={getMapboxToken()}
        initialViewState={{
          longitude: INDIA_CENTER[0],
          latitude: INDIA_CENTER[1],
          zoom: GLOBE_ZOOM,
        }}
        style={{ width: "100%", height: "100%", minHeight: 320 }}
        mapStyle={mapStyle}
        onLoad={() => applySettings(isDark)}
        onMouseDown={pauseSpin}
        onTouchStart={pauseSpin}
        onWheel={pauseSpin}
        onMove={(e) => {
          const z = e.target.getZoom();
          const map = e.target as unknown as GlobeCapableMap;
          if (z >= FLAT_ZOOM && projRef.current !== "mercator") {
            projRef.current = "mercator";
            setProjectionState("mercator");
            map.setProjection?.("mercator");
          } else if (z <= ROUND_ZOOM && projRef.current !== "globe") {
            projRef.current = "globe";
            setProjectionState("globe");
            map.setProjection?.("globe");
          }
        }}
        onClick={(e) => {
          setArea(
            Number(e.lngLat.lat.toFixed(4)),
            Number(e.lngLat.lng.toFixed(4)),
            `Custom pin ${e.lngLat.lat.toFixed(2)}, ${e.lngLat.lng.toFixed(2)}`,
          );
        }}
      >
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

        {projection === "globe" &&
          AREA_PRESETS.map((p) => (
            <Marker
              key={p.id}
              longitude={p.lng}
              latitude={p.lat}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setArea(p.lat, p.lng, p.label);
              }}
            >
              <span className="flex cursor-pointer flex-col items-center gap-1">
                <span className="block size-2.5 rounded-full bg-primary ring-4 ring-primary/20 transition-transform hover:scale-125" />
                <span className="rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap text-foreground backdrop-blur">
                  {p.label.split(",")[0]}
                </span>
              </span>
            </Marker>
          ))}

        <Marker longitude={lng} latitude={lat} anchor="center">
          <span className="block size-3 rounded-full bg-blue-600 ring-4 ring-blue-600/20" />
        </Marker>

        {competitors.map(
          (c) =>
            c.lat != null &&
            c.lng != null && (
              <Marker
                key={competitorKey(c)}
                longitude={c.lng}
                latitude={c.lat}
                anchor="bottom"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  setSelected(c);
                }}
              >
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-[10px] font-bold text-white shadow transition-transform",
                    selected &&
                      competitorKey(selected) === competitorKey(c) &&
                      "scale-125 ring-2 ring-white dark:ring-black",
                  )}
                  style={{ backgroundColor: pinColor(c.rating) }}
                  title={c.title}
                >
                  {c.rating != null ? c.rating.toFixed(1) : "–"}
                </span>
              </Marker>
            ),
        )}

        {selected && selected.lat != null && selected.lng != null && (
          <Popup
            longitude={selected.lng}
            latitude={selected.lat}
            offset={14}
            maxWidth="260px"
            className="gapmap-popup"
            onClose={() => setSelected(null)}
          >
            <p className="text-[15px] leading-[20px] font-semibold tracking-[-0.01em]">
              {selected.title.split("|")[0]?.trim() ?? selected.title}
            </p>
            <p className="mt-0.5 text-sm leading-[20px]">
              <span
                className="font-semibold"
                style={{ color: pinColor(selected.rating) }}
              >
                {selected.rating != null
                  ? `${selected.rating.toFixed(1)} ★`
                  : "Unrated"}
              </span>
              {selected.reviews != null && (
                <span className="font-normal text-muted-foreground">
                  {" "}
                  · {selected.reviews.toLocaleString("en-IN")} reviews
                </span>
              )}
            </p>
            <p className="mt-0.5 text-[13px] leading-[18px] font-normal text-muted-foreground">
              {areaLabel}
            </p>
          </Popup>
        )}
      </Map>

      {projection === "mercator" && (
        <button
          type="button"
          onClick={() => {
            const map = mapRef.current?.getMap() as unknown as
              | { flyTo: (opts: Record<string, unknown>) => void }
              | undefined;
            spinRef.current = true;
            map?.flyTo({
              center: [...INDIA_CENTER],
              zoom: GLOBE_ZOOM,
              duration: 3000,
              essential: true,
            });
          }}
          className="absolute top-3 right-3 flex items-center gap-1.5 rounded-md border border-border bg-background/90 px-2.5 py-1.5 text-xs font-medium shadow backdrop-blur hover:bg-muted"
        >
          <HugeiconsIcon icon={GlobalIcon} size={14} strokeWidth={2} />
          Globe
        </button>
      )}
    </div>
  );
}
