"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Location01Icon } from "@hugeicons/core-free-icons";
import { AREA_PRESETS } from "@/lib/categories";
import { searchPlaces, type GeocodingResult } from "@/lib/mapbox-geocoding";
import { cn } from "@/lib/utils";

interface LocationSearchProps {
  value: string;
  onSelect: (lat: number, lng: number, label: string) => void;
  className?: string;
  placeholder?: string;
}

export function LocationSearch({
  value,
  onSelect,
  className,
  placeholder = "Search a city, neighborhood, or address",
}: LocationSearchProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<GeocodingResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Sync display with store value
  const displayLabel = React.useMemo(() => {
    if (/\d+\.\d+/.test(value) || value.toLowerCase().includes("pin")) {
      return "Selected location";
    }
    return value;
  }, [value]);

  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  React.useEffect(() => {
    const clean = query.trim();
    if (!isOpen || !clean) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await searchPlaces(clean);
      if (!cancelled) {
        setResults(res);
        setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, isOpen]);

  const handleSelectPreset = (preset: (typeof AREA_PRESETS)[number]) => {
    onSelect(preset.lat, preset.lng, preset.label);
    setIsOpen(false);
    setQuery("");
  };

  const handleSelectResult = (item: GeocodingResult) => {
    onSelect(item.lat, item.lng, item.fullAddress);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className={cn("relative min-w-0", className)}>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? query : displayLabel}
          placeholder={isOpen ? placeholder : displayLabel || placeholder}
          onFocus={() => {
            setIsOpen(true);
            setQuery("");
          }}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsOpen(false);
              inputRef.current?.blur();
            }
          }}
          className="h-9 w-full min-w-40 rounded-md border border-input bg-background px-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <span className="pointer-events-none absolute right-2.5 text-muted-foreground">
          <HugeiconsIcon icon={Location01Icon} size={15} strokeWidth={2} />
        </span>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 max-h-72 w-full min-w-64 overflow-y-auto rounded-lg border border-border bg-popover p-1.5 text-popover-foreground shadow-lg">
          {!query.trim() && (
            <div className="flex flex-col gap-1">
              <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
                Popular places
              </p>
              {AREA_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className="flex flex-col rounded-md px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-muted"
                >
                  <span className="font-medium text-foreground">
                    {p.label.split(",")[0]}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {p.label}
                  </span>
                </button>
              ))}
            </div>
          )}

          {query.trim().length > 0 && (
            <div className="flex flex-col gap-1">
              {loading && (
                <p className="px-2 py-2 text-xs text-muted-foreground">
                  Searching places…
                </p>
              )}
              {!loading && results.length === 0 && (
                <p className="px-2 py-2 text-xs text-muted-foreground">
                  No places found. Try another city or neighborhood.
                </p>
              )}
              {!loading &&
                results.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelectResult(r)}
                    className="flex flex-col rounded-md px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-muted"
                  >
                    <span className="font-medium text-foreground">
                      {r.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground line-clamp-1">
                      {r.fullAddress}
                    </span>
                  </button>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
