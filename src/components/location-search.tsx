"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  Location01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { AREA_PRESETS } from "@/lib/categories";
import { searchPlaces, type GeocodingResult } from "@/lib/mapbox-geocoding";
import { cn } from "@/lib/utils";

interface LocationSearchProps {
  value: string;
  onSelect: (lat: number, lng: number, label: string) => void;
  className?: string;
  placeholder?: string;
}

type PopoverPlacement = "bottom" | "top";

interface PopoverPosition {
  placement: PopoverPlacement;
  maxHeight: number;
}

const VIEWPORT_MARGIN = 12;
const INPUT_GAP = 6;
const IDEAL_DROPDOWN_HEIGHT = 280;
const MIN_DROPDOWN_HEIGHT = 120;

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
  const [activeIndex, setActiveIndex] = React.useState<number>(-1);

  const [popoverPosition, setPopoverPosition] = React.useState<PopoverPosition>({
    placement: "bottom",
    maxHeight: IDEAL_DROPDOWN_HEIGHT,
  });

  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listboxRef = React.useRef<HTMLUListElement>(null);

  // Sync display with store value
  const displayLabel = React.useMemo(() => {
    if (/\d+\.\d+/.test(value) || value.toLowerCase().includes("pin")) {
      return "Selected location";
    }
    return value;
  }, [value]);

  const updatePopoverPosition = React.useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const vh = window.visualViewport
      ? window.visualViewport.height
      : window.innerHeight;
    const viewportTop = window.visualViewport
      ? window.visualViewport.offsetTop
      : 0;

    const spaceBelow =
      vh - (rect.bottom - viewportTop) - VIEWPORT_MARGIN - INPUT_GAP;
    const spaceAbove = rect.top - viewportTop - VIEWPORT_MARGIN - INPUT_GAP;

    let placement: PopoverPlacement = "bottom";
    let maxHeight = IDEAL_DROPDOWN_HEIGHT;

    if (spaceBelow >= IDEAL_DROPDOWN_HEIGHT) {
      placement = "bottom";
      maxHeight = Math.min(IDEAL_DROPDOWN_HEIGHT, Math.floor(spaceBelow));
    } else if (spaceAbove >= IDEAL_DROPDOWN_HEIGHT) {
      placement = "top";
      maxHeight = Math.min(IDEAL_DROPDOWN_HEIGHT, Math.floor(spaceAbove));
    } else if (spaceAbove > spaceBelow) {
      placement = "top";
      maxHeight = Math.max(MIN_DROPDOWN_HEIGHT, Math.floor(spaceAbove));
    } else {
      placement = "bottom";
      maxHeight = Math.max(MIN_DROPDOWN_HEIGHT, Math.floor(spaceBelow));
    }

    setPopoverPosition((prev) => {
      if (prev.placement === placement && prev.maxHeight === maxHeight) {
        return prev;
      }
      return { placement, maxHeight };
    });
  }, []);

  React.useLayoutEffect(() => {
    if (!isOpen) return;

    updatePopoverPosition();

    const handleUpdate = () => {
      updatePopoverPosition();
    };

    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, {
      passive: true,
      capture: true,
    });
    window.addEventListener("orientationchange", handleUpdate);

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", handleUpdate);
      vv.addEventListener("scroll", handleUpdate);
    }

    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
      window.removeEventListener("orientationchange", handleUpdate);
      if (vv) {
        vv.removeEventListener("resize", handleUpdate);
        vv.removeEventListener("scroll", handleUpdate);
      }
    };
  }, [isOpen, updatePopoverPosition]);

  // Sync active item scrolling
  React.useEffect(() => {
    if (activeIndex >= 0 && listboxRef.current) {
      const activeEl = listboxRef.current.querySelector(
        `[data-location-index="${activeIndex}"]`,
      );
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [activeIndex]);

  // Close on outside click
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setQuery("");
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Debounced search
  React.useEffect(() => {
    const clean = query.trim();
    if (!isOpen || !clean) {
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await searchPlaces(clean);
      if (!cancelled) {
        setResults(res);
        setLoading(false);
        setActiveIndex(res.length > 0 ? 0 : -1);
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
    setActiveIndex(-1);
    inputRef.current?.blur();
  };

  const handleSelectResult = (item: GeocodingResult) => {
    onSelect(item.lat, item.lng, item.fullAddress);
    setIsOpen(false);
    setQuery("");
    setActiveIndex(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const isSearching = query.trim().length > 0;
    const itemCount = isSearching ? results.length : AREA_PRESETS.length;

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setIsOpen(true);
        setActiveIndex(0);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (itemCount > 0) {
        setActiveIndex((prev) => (prev < 0 ? 0 : (prev + 1) % itemCount));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (itemCount > 0) {
        setActiveIndex((prev) => (prev <= 0 ? itemCount - 1 : prev - 1));
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (isSearching) {
        if (activeIndex >= 0 && results[activeIndex]) {
          handleSelectResult(results[activeIndex]);
        } else if (results.length > 0) {
          handleSelectResult(results[0]);
        }
      } else {
        if (activeIndex >= 0 && AREA_PRESETS[activeIndex]) {
          handleSelectPreset(AREA_PRESETS[activeIndex]);
        }
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setQuery("");
      setActiveIndex(-1);
    } else if (e.key === "Tab") {
      setIsOpen(false);
      setQuery("");
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative min-w-0 font-sans", className)}>
      <div className="relative flex items-center">
        <HugeiconsIcon
          icon={Search01Icon}
          size={15}
          strokeWidth={1.8}
          className="pointer-events-none absolute left-3.5 text-muted-foreground/60 select-none"
        />

        <input
          ref={inputRef}
          id="location-search-input"
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="location-options-list"
          aria-label="Where do you want to look?"
          value={isOpen ? query : displayLabel}
          placeholder={isOpen ? placeholder : displayLabel || placeholder}
          onFocus={() => {
            setIsOpen(true);
            setQuery("");
            setResults([]);
            setLoading(false);
            setActiveIndex(-1);
          }}
          onClick={() => {
            if (!isOpen) {
              setIsOpen(true);
              setQuery("");
              setResults([]);
              setLoading(false);
              setActiveIndex(-1);
            }
          }}
          onChange={(e) => {
            const nextVal = e.target.value;
            setQuery(nextVal);
            if (!nextVal.trim()) {
              setResults([]);
              setLoading(false);
            }
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          className="h-10 w-full min-w-36 rounded-xl border border-border/70 bg-card pl-9 pr-9 text-sm text-foreground transition-all placeholder:text-muted-foreground/60 hover:border-border focus-visible:outline-none focus-visible:border-border focus-visible:ring-2 focus-visible:ring-ring/20"
        />

        <HugeiconsIcon
          icon={Location01Icon}
          size={14}
          strokeWidth={1.8}
          className="pointer-events-none absolute right-3.5 text-muted-foreground/60 select-none"
        />
      </div>

      {isOpen && (
        <div
          style={{
            ...(popoverPosition.placement === "top"
              ? {
                  bottom: "100%",
                  marginBottom: `${INPUT_GAP}px`,
                  top: "auto",
                  marginTop: 0,
                }
              : {
                  top: "100%",
                  marginTop: `${INPUT_GAP}px`,
                  bottom: "auto",
                  marginBottom: 0,
                }),
            maxHeight: `${popoverPosition.maxHeight}px`,
          }}
          className={cn(
            "absolute left-0 z-50 w-full min-w-64 overflow-hidden rounded-xl border border-border/80 bg-popover p-1 text-popover-foreground shadow-md",
            popoverPosition.placement === "top"
              ? "origin-bottom animate-in fade-in-0 zoom-in-95"
              : "origin-top animate-in fade-in-0 zoom-in-95",
          )}
        >
          <ul
            ref={listboxRef}
            id="location-options-list"
            role="listbox"
            aria-label="Location suggestions"
            className="flex flex-col gap-0.5 overflow-y-auto overscroll-contain"
            style={{
              maxHeight: `calc(${popoverPosition.maxHeight}px - 8px)`,
            }}
          >
            {!query.trim() && (
              <>
                <li className="list-none">
                  <div className="px-3 pt-2 pb-1 text-[11px] font-medium text-muted-foreground">
                    Popular places
                  </div>
                </li>
                {AREA_PRESETS.map((p, idx) => {
                  const isSelected = value === p.label;
                  const isHighlighted = activeIndex === idx;

                  return (
                    <li
                      key={p.id}
                      role="option"
                      aria-selected={isSelected}
                      data-location-index={idx}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => handleSelectPreset(p)}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer text-foreground",
                        isHighlighted ? "bg-muted/70" : "hover:bg-muted/40",
                        isSelected && "font-medium",
                      )}
                    >
                      <div className="flex flex-col truncate">
                        <span className="truncate">{p.label.split(",")[0]}</span>
                        <span className="text-[11px] text-muted-foreground truncate">
                          {p.label}
                        </span>
                      </div>
                      {isSelected && (
                        <HugeiconsIcon
                          icon={Tick02Icon}
                          size={14}
                          strokeWidth={2.2}
                          className="text-foreground shrink-0 ml-2"
                        />
                      )}
                    </li>
                  );
                })}
              </>
            )}

            {query.trim().length > 0 && (
              <>
                {loading && (
                  <li className="px-3 py-3 text-center text-xs text-muted-foreground">
                    Searching places…
                  </li>
                )}
                {!loading && results.length === 0 && (
                  <li className="px-3 py-3 text-center text-xs text-muted-foreground">
                    No places found. Try another city or neighborhood.
                  </li>
                )}
                {!loading &&
                  results.map((r, idx) => {
                    const isHighlighted = activeIndex === idx;
                    return (
                      <li
                        key={r.id}
                        role="option"
                        aria-selected={isHighlighted}
                        data-location-index={idx}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => handleSelectResult(r)}
                        className={cn(
                          "flex flex-col rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer text-foreground",
                          isHighlighted ? "bg-muted/70" : "hover:bg-muted/40",
                        )}
                      >
                        <span className="font-medium truncate">{r.name}</span>
                        <span className="text-[11px] text-muted-foreground truncate">
                          {r.fullAddress}
                        </span>
                      </li>
                    );
                  })}
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
