"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Search01Icon,
  Location01Icon,
} from "@hugeicons/core-free-icons";
import { ShortcutPill } from "@/components/shortcut-pill";
import { resolveCategory } from "@/lib/categories";
import {
  findMatchingPreset,
  parseSearchQuery,
} from "@/lib/search-parser";
import { searchPlaces, type GeocodingResult } from "@/lib/mapbox-geocoding";
import { BusinessPickerModal } from "@/components/business-picker-modal";
import { LiquidMetalButton } from "@/components/liquid-metal-button";
import { cn } from "@/lib/utils";

const QUICK_PICKS = [
  { id: "cafe", label: "Cafe" },
  { id: "bakery", label: "Bakery" },
  { id: "gym", label: "Gym" },
  { id: "salon", label: "Salon" },
  { id: "laundromat", label: "Laundry" },
  { id: "pet-grooming", label: "Pet grooming" },
] as const;

interface UnifiedSearchProps {
  initialCategoryId?: string;
  initialAreaLabel?: string;
  initialLat?: number;
  initialLng?: number;
  onSearch: (params: {
    lat: number;
    lng: number;
    categoryId: string;
    areaLabel: string;
    scope?: "city" | "neighborhood";
  }) => void;
  className?: string;
}

export function UnifiedSearch({
  initialCategoryId = "",
  initialAreaLabel = "",
  initialLat,
  initialLng,
  onSearch,
  className,
}: UnifiedSearchProps) {
  // Construct initial query only if explicit initial values are provided
  const defaultInitialQuery = React.useMemo(() => {
    if (!initialCategoryId || !initialAreaLabel) return "";
    const defaultCategory = resolveCategory(initialCategoryId);
    const defaultLocationName = initialAreaLabel.split(",")[0].trim();
    if (!defaultCategory.label || !defaultLocationName) return "";
    return `${defaultCategory.label} in ${defaultLocationName}`;
  }, [initialCategoryId, initialAreaLabel]);

  const [query, setQuery] = React.useState(defaultInitialQuery);
  const [asyncArea, setAsyncArea] = React.useState<{
    lat: number;
    lng: number;
    areaLabel: string;
    scope?: "city" | "neighborhood";
  } | null>(() => {
    if (initialLat && initialLng && initialAreaLabel) {
      return {
        lat: initialLat,
        lng: initialLng,
        areaLabel: initialAreaLabel,
      };
    }
    return null;
  });

  const [isResolving, setIsResolving] = React.useState(false);
  const [asyncFailed, setAsyncFailed] = React.useState(false);
  const [asyncError, setAsyncError] = React.useState(false);
  const [showValidation, setShowValidation] = React.useState(false);

  // Location suggestions / ambiguous disambiguation
  const [suggestions, setSuggestions] = React.useState<GeocodingResult[]>([]);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = React.useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = React.useState(-1);

  // Centered "+ More" business picker modal state
  const [isMoreOpen, setIsMoreOpen] = React.useState(false);

  const containerRef = React.useRef<HTMLFormElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const moreButtonRef = React.useRef<HTMLButtonElement>(null);

  // Parse query into business and location segments
  const parsed = React.useMemo(() => parseSearchQuery(query), [query]);

  // Resolve business category (predefined or custom)
  const activeCategory = React.useMemo(() => {
    if (!parsed.businessText) return null;
    return resolveCategory(parsed.businessText);
  }, [parsed.businessText]);

  // Check synchronous preset match (0ms latency)
  const preset = React.useMemo(
    () => findMatchingPreset(parsed.locationText),
    [parsed.locationText],
  );

  // Derive final resolved location
  const resolvedArea = preset
    ? {
        lat: preset.lat,
        lng: preset.lng,
        areaLabel: preset.label,
        scope: preset.type,
      }
    : parsed.locationText.trim()
      ? asyncArea
      : null;

  const resolutionFailed =
    !preset && Boolean(parsed.locationText.trim()) && asyncFailed;
  const resolutionError =
    !preset && Boolean(parsed.locationText.trim()) && asyncError;

  // Debounced location resolution & autocomplete suggestions for non-presets
  React.useEffect(() => {
    const locText = parsed.locationText.trim();

    if (!locText || preset) {
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      setIsResolving(true);
      setAsyncFailed(false);
      setAsyncError(false);

      try {
        const places = await searchPlaces(locText);
        if (!cancelled) {
          if (places.length > 0) {
            setSuggestions(places);
            if (document.activeElement === inputRef.current) {
              setIsAutocompleteOpen(true);
            }
            setAsyncArea({
              lat: places[0].lat,
              lng: places[0].lng,
              areaLabel: places[0].fullAddress || places[0].name,
              scope: places[0].scope,
            });
            setAsyncFailed(false);
            setAsyncError(false);
          } else {
            setSuggestions([]);
            setIsAutocompleteOpen(false);
            setAsyncArea(null);
            setAsyncFailed(true);
          }
          setIsResolving(false);
        }
      } catch {
        if (!cancelled) {
          setSuggestions([]);
          setIsAutocompleteOpen(false);
          setAsyncArea(null);
          setAsyncError(true);
          setIsResolving(false);
        }
      }
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [parsed.locationText, preset]);

  // Close location autocomplete on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setIsAutocompleteOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isReady =
    !isResolving && activeCategory !== null && resolvedArea !== null;

  const hasFeedback =
    (isReady && Boolean(activeCategory) && Boolean(resolvedArea)) ||
    isResolving ||
    (!isResolving && resolutionFailed && Boolean(parsed.locationText)) ||
    (!isResolving && resolutionError && Boolean(parsed.locationText)) ||
    (showValidation &&
      !isResolving &&
      !parsed.businessText &&
      !parsed.locationText) ||
    (!isResolving &&
      !resolutionFailed &&
      !resolutionError &&
      Boolean(parsed.businessText) &&
      !parsed.locationText) ||
    (!isResolving && !parsed.businessText && Boolean(parsed.locationText));

  // Handle submission
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isReady || !activeCategory || !resolvedArea) {
      setShowValidation(true);
      inputRef.current?.focus();
      return;
    }

    setIsAutocompleteOpen(false);
    setIsMoreOpen(false);
    onSearch({
      lat: resolvedArea.lat,
      lng: resolvedArea.lng,
      categoryId: activeCategory.id,
      areaLabel: resolvedArea.areaLabel,
      scope: resolvedArea.scope,
    });
  };

  // Select an autocomplete location suggestion
  const handleSelectSuggestion = (place: GeocodingResult) => {
    setAsyncArea({
      lat: place.lat,
      lng: place.lng,
      areaLabel: place.fullAddress,
      scope: place.scope,
    });
    setAsyncFailed(false);
    setAsyncError(false);
    setIsAutocompleteOpen(false);
    setActiveSuggestionIndex(-1);

    const shortPlace = place.name || place.fullAddress.split(",")[0].trim();
    if (parsed.businessText) {
      setQuery(`${parsed.businessText} in ${shortPlace}`);
    } else {
      setQuery(`in ${shortPlace}`);
    }

    inputRef.current?.focus();
  };

  React.useEffect(() => {
    if (!isAutocompleteOpen) return;
    const handleOutside = (e: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsAutocompleteOpen(false);
      }
    };
    document.addEventListener("pointerdown", handleOutside);
    return () => {
      document.removeEventListener("pointerdown", handleOutside);
    };
  }, [isAutocompleteOpen]);

  // Keyboard navigation within the input & suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isAutocompleteOpen && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestionIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0,
        );
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1,
        );
        return;
      }

      if (e.key === "Enter" && activeSuggestionIndex >= 0) {
        e.preventDefault();
        const selected = suggestions[activeSuggestionIndex];
        if (selected) {
          handleSelectSuggestion(selected);
        }
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        setIsAutocompleteOpen(false);
        setActiveSuggestionIndex(-1);
        return;
      }
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (isReady) {
        handleSubmit();
      }
    }
  };

  // Select a business type (from quick picks or "+ More" modal) while preserving location
  const handleSelectBusiness = (businessLabel: string) => {
    const isCurrentlySelected =
      activeCategory !== null &&
      (activeCategory.id.toLowerCase() === businessLabel.toLowerCase() ||
        activeCategory.label.toLowerCase() === businessLabel.toLowerCase());

    const locText = parsed.locationText.trim();

    if (isCurrentlySelected) {
      setQuery(locText ? `in ${locText}` : "");
      return;
    }

    let nextQuery = "";

    if (locText) {
      nextQuery = `${businessLabel} in ${locText}`;
    } else if (resolvedArea) {
      const placeShort = resolvedArea.areaLabel.split(",")[0].trim();
      nextQuery = `${businessLabel} in ${placeShort}`;
    } else {
      nextQuery = `${businessLabel} in `;
    }

    setQuery(nextQuery);
    setIsAutocompleteOpen(false);
    setIsMoreOpen(false);
    if (showValidation) setShowValidation(false);

    inputRef.current?.focus();

    if (!locText && !resolvedArea) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.selectionStart = nextQuery.length;
          inputRef.current.selectionEnd = nextQuery.length;
        }
      }, 0);
    }
  };

  // Clear query handler
  const handleClear = () => {
    setQuery("");
    setShowValidation(false);
    setAsyncArea(null);
    setSuggestions([]);
    setIsAutocompleteOpen(false);
    setIsMoreOpen(false);
    setIsResolving(false);
    setAsyncFailed(false);
    setAsyncError(false);
    inputRef.current?.focus();
  };

  // Toggle "+ More" modal
  const toggleMorePicker = () => {
    setIsAutocompleteOpen(false);
    setIsMoreOpen(true);
  };

  const isPredefinedSelected =
    activeCategory !== null &&
    QUICK_PICKS.some(
      (pick) =>
        activeCategory.id.toLowerCase() === pick.id.toLowerCase() ||
        activeCategory.label.toLowerCase() === pick.label.toLowerCase(),
    );

  const isMoreActive =
    isMoreOpen || (activeCategory !== null && !isPredefinedSelected);

  return (
    <form
      ref={containerRef}
      onSubmit={handleSubmit}
      className={cn("flex flex-col relative w-full sm:max-w-[496px]", className)}
    >
      {/* 1. Accessible Label */}
      <label
        htmlFor="unified-search-input"
        className="text-xs sm:text-[13px] font-medium tracking-tight text-muted-foreground/90 sm:text-foreground/80 select-none"
      >
        What are you thinking of opening?
      </label>

      {/* 2. Primary Unified Input with Embedded Autocomplete */}
      <div className="relative mt-1.5 sm:mt-2 flex items-center">
        <HugeiconsIcon
          icon={Search01Icon}
          size={16}
          strokeWidth={1.8}
          className="pointer-events-none absolute left-3.5 text-muted-foreground/60 select-none"
        />

        <input
          ref={inputRef}
          id="unified-search-input"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (showValidation) setShowValidation(false);
            if (isMoreOpen) setIsMoreOpen(false);
          }}
          onFocus={() => {
            if (suggestions.length > 0 && parsed.locationText) {
              setIsAutocompleteOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Choose a business type, then add a location."
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-expanded={isAutocompleteOpen}
          aria-autocomplete="list"
          aria-controls="location-autocomplete-list"
          aria-activedescendant={
            activeSuggestionIndex >= 0
              ? `location-option-${activeSuggestionIndex}`
              : undefined
          }
          data-cuelume-type
          className={cn(
            "h-[45px] w-full rounded-[16px] border border-black/[0.06] dark:border-white/[0.08] bg-[#f4f4f6] dark:bg-[#191b19] pl-10 pr-10 text-[14px] leading-5 font-normal text-[#18181b] dark:text-[#f3f4f3] placeholder:text-[#18181b]/45 dark:placeholder:text-[#949a94]/60 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),inset_0_2px_4px_0_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),inset_0_2px_4px_0_rgba(0,0,0,0.4)] transition-all duration-150 hover:bg-[#efeff2] dark:hover:bg-[#1d201d] hover:border-black/[0.09] dark:hover:border-white/[0.13] outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:bg-[#f8f8fa] dark:focus-visible:bg-[#212421] focus-visible:border-black/[0.12] dark:focus-visible:border-white/[0.18] focus-visible:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8),inset_0_2px_4px_0_rgba(0,0,0,0.06)] dark:focus-visible:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),inset_0_2px_4px_0_rgba(0,0,0,0.4)]",
            showValidation && !isReady && "border-amber-500/50 ring-2 ring-amber-500/25 dark:border-amber-400/50 dark:ring-amber-400/25",
          )}
        />

        {query.length > 0 && (
          <button
            type="button"
            aria-label="Clear search query"
            onClick={handleClear}
            className="absolute right-2.5 flex size-6.5 items-center justify-center rounded-full text-muted-foreground/50 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition-colors active:scale-95"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2} />
          </button>
        )}

        {/* Location Autocomplete & Disambiguation Popover */}
        {isAutocompleteOpen && suggestions.length > 0 && (
          <ul
            id="location-autocomplete-list"
            role="listbox"
            aria-label="Location suggestions"
            className="absolute top-full left-0 right-0 z-50 mt-1.5 max-h-56 overflow-y-auto overscroll-contain rounded-[16px] border border-black/[0.06] dark:border-white/10 bg-[#f4f4f6]/98 dark:bg-[#1a1c1a]/98 p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.1),0_2px_6px_rgba(0,0,0,0.04)] dark:shadow-[0_16px_48px_-8px_rgba(0,0,0,0.7)] backdrop-blur-md"
          >
            {suggestions.map((item, idx) => {
              const isSelected = activeSuggestionIndex === idx;
              const placeParts = item.fullAddress.split(",");
              const mainName = item.name || placeParts[0].trim();
              const secondaryContext =
                placeParts.length > 1 ? placeParts.slice(1).join(", ").trim() : "";

              return (
                <li
                  key={item.id || idx}
                  id={`location-option-${idx}`}
                  role="option"
                  aria-selected={isSelected}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    handleSelectSuggestion(item);
                  }}
                  onClick={() => handleSelectSuggestion(item)}
                  onMouseEnter={() => setActiveSuggestionIndex(idx)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2.5 sm:py-2 text-sm cursor-pointer transition-colors select-none",
                    isSelected
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-muted/60",
                  )}
                >
                  <HugeiconsIcon
                    icon={Location01Icon}
                    size={14}
                    strokeWidth={1.8}
                    className="text-muted-foreground/70 shrink-0"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium text-foreground text-xs leading-snug truncate">
                      {mainName}
                    </span>
                    {secondaryContext && (
                      <span className="text-[11px] text-muted-foreground truncate leading-snug">
                        {secondaryContext}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* 3. Progressive-Disclosure Quick-Pick Pills + More */}
      <div
        className="relative mt-2 sm:mt-2.5 flex flex-wrap items-center gap-1.5"
        role="group"
        aria-label="Popular business shortcuts"
      >
        {QUICK_PICKS.map((pick) => {
          const isSelected =
            activeCategory !== null &&
            (activeCategory.id.toLowerCase() === pick.id.toLowerCase() ||
              activeCategory.label.toLowerCase() === pick.label.toLowerCase());

          return (
            <ShortcutPill
              key={pick.id}
              data-cuelume-select
              selected={isSelected}
              onClick={() => handleSelectBusiness(pick.label)}
            >
              {pick.label}
            </ShortcutPill>
          );
        })}

        {/* "+ More" Progressive Disclosure Pill */}
        <ShortcutPill
          ref={moreButtonRef}
          data-cuelume-open
          selected={isMoreActive}
          onClick={toggleMorePicker}
          aria-expanded={isMoreOpen}
          aria-haspopup="dialog"
          className={cn(
            "transition-all duration-150 font-medium",
            !isMoreActive && "text-muted-foreground hover:text-foreground",
          )}
        >
          {isMoreActive && activeCategory && !isPredefinedSelected
            ? activeCategory.label
            : "+ More"}
        </ShortcutPill>

        {/* Centered Business Picker Modal */}
        <BusinessPickerModal
          isOpen={isMoreOpen}
          onClose={() => setIsMoreOpen(false)}
          onSelectBusiness={handleSelectBusiness}
          currentBusinessLabel={activeCategory?.label}
          triggerRef={moreButtonRef}
        />
      </div>

      {/* 4. Compact Confirmation State: shown naturally only when feedback/location exists */}
      {hasFeedback && (
        <div
          className="mt-3 min-h-[22px] flex items-center text-xs tracking-tight animate-in fade-in duration-150"
          aria-live="polite"
        >
          {/* Valid & Ready State */}
          {isReady && activeCategory && resolvedArea && (
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.15)] shrink-0" />
              <span>{activeCategory.label}</span>
              <span className="text-muted-foreground/40">·</span>
              <span className="truncate">{resolvedArea.areaLabel}</span>
            </div>
          )}

          {/* Resolving State */}
          {isResolving && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_0_2px_rgba(245,158,11,0.15)] shrink-0" />
              <span>Looking up location…</span>
            </div>
          )}

          {/* Location Resolution Failed */}
          {!isResolving && resolutionFailed && parsed.locationText && (
            <span className="text-rose-600 dark:text-rose-400">
              Location not found. Try a neighborhood or city name.
            </span>
          )}

          {/* Location Network / API Error */}
          {!isResolving && resolutionError && parsed.locationText && (
            <span className="text-rose-600 dark:text-rose-400">
              Unable to reach location service. Please check your connection.
            </span>
          )}

          {/* Validation prompt when user clicks CTA without entering valid search */}
          {showValidation && !isResolving && !parsed.businessText && !parsed.locationText && (
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
              <span className="size-1.5 rounded-full bg-amber-500 shadow-[0_0_0_2px_rgba(245,158,11,0.2)] shrink-0" />
              <span>Please enter a business and location to find opportunities</span>
            </div>
          )}

          {/* Needs Location State */}
          {!isResolving &&
            !resolutionFailed &&
            !resolutionError &&
            parsed.businessText &&
            !parsed.locationText && (
              <div
                className={cn(
                  "flex items-center gap-1.5",
                  showValidation
                    ? "text-amber-600 dark:text-amber-400 font-medium"
                    : "text-muted-foreground/80",
                )}
              >
                {showValidation && (
                  <span className="size-1.5 rounded-full bg-amber-500 shadow-[0_0_0_2px_rgba(245,158,11,0.2)] shrink-0" />
                )}
                <span>Add a location to continue (e.g. “in Koramangala” or “Bandra West”)</span>
              </div>
            )}

          {/* Needs Business State */}
          {!isResolving &&
            !parsed.businessText &&
            parsed.locationText && (
              <div
                className={cn(
                  "flex items-center gap-1.5",
                  showValidation
                    ? "text-amber-600 dark:text-amber-400 font-medium"
                    : "text-muted-foreground/80",
                )}
              >
                {showValidation && (
                  <span className="size-1.5 rounded-full bg-amber-500 shadow-[0_0_0_2px_rgba(245,158,11,0.2)] shrink-0" />
                )}
                <span>Add a business type to continue (e.g. “Cafe” or “Gym”)</span>
              </div>
            )}
        </div>
      )}

      {/* 5. Primary CTA */}
      <div className={cn(hasFeedback ? "mt-3.5 sm:mt-4" : "mt-5 sm:mt-6")}>
        <LiquidMetalButton
          label="Find opportunities"
          type="submit"
          disabled={false}
          title={
            isReady && activeCategory && resolvedArea
              ? `Find opportunities for ${activeCategory.label} in ${resolvedArea.areaLabel}`
              : "Find opportunities"
          }
        />
      </div>

      {/* 6. Helpful Example Guidance (Only shown when no valid search entered yet) */}
      {!isReady && (
        <p className="mt-2.5 sm:mt-3 text-[11.5px] sm:text-xs text-muted-foreground/60 select-none">
          Try{" "}
          <button
            type="button"
            onClick={() => {
              setQuery("Gym in Mumbai");
              if (showValidation) setShowValidation(false);
            }}
            className="text-foreground/75 hover:text-foreground underline underline-offset-3 decoration-muted-foreground/30 hover:decoration-foreground cursor-pointer transition-colors"
          >
            “Gym in Mumbai”
          </button>{" "}
          or{" "}
          <button
            type="button"
            onClick={() => {
              setQuery("Cafe in Koramangala");
              if (showValidation) setShowValidation(false);
            }}
            className="text-foreground/75 hover:text-foreground underline underline-offset-3 decoration-muted-foreground/30 hover:decoration-foreground cursor-pointer transition-colors"
          >
            “Cafe in Koramangala”
          </button>
        </p>
      )}
    </form>
  );
}
