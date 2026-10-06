"use client";

import * as React from "react";
import { searchPlaces, type GeocodingResult } from "@/lib/mapbox-geocoding";
import { findMatchingPreset } from "@/lib/search-parser";

export interface ResolvedArea {
  lat: number;
  lng: number;
  areaLabel: string;
  scope?: "city" | "neighborhood";
}

interface UsePlaceAutocompleteProps {
  locationText: string;
  initialArea: ResolvedArea | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  containerRef: React.RefObject<HTMLElement | null>;
}

export function usePlaceAutocomplete({
  locationText,
  initialArea,
  inputRef,
  containerRef,
}: UsePlaceAutocompleteProps) {
  const [asyncArea, setAsyncArea] = React.useState<ResolvedArea | null>(initialArea);
  const [isResolving, setIsResolving] = React.useState(false);
  const [asyncFailed, setAsyncFailed] = React.useState(false);
  const [asyncError, setAsyncError] = React.useState(false);

  const [suggestions, setSuggestions] = React.useState<GeocodingResult[]>([]);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = React.useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = React.useState(-1);

  // Presets resolve synchronously without waiting on network geocoding.
  const preset = React.useMemo(
    () => findMatchingPreset(locationText),
    [locationText],
  );

  const resolvedArea = preset
    ? {
        lat: preset.lat,
        lng: preset.lng,
        areaLabel: preset.label,
        scope: preset.type,
      }
    : locationText.trim()
      ? asyncArea
      : null;

  const resolutionFailed =
    !preset && Boolean(locationText.trim()) && asyncFailed;
  const resolutionError =
    !preset && Boolean(locationText.trim()) && asyncError;

  // Debounce remote geocoding to avoid querying Mapbox on every keystroke.
  React.useEffect(() => {
    const locText = locationText.trim();

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
  }, [locationText, preset, inputRef]);

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
  }, [containerRef]);

  const closeAutocomplete = React.useCallback(() => {
    setIsAutocompleteOpen(false);
  }, []);

  const clearAutocomplete = React.useCallback(() => {
    setAsyncArea(null);
    setSuggestions([]);
    setIsAutocompleteOpen(false);
    setIsResolving(false);
    setAsyncFailed(false);
    setAsyncError(false);
    setActiveSuggestionIndex(-1);
  }, []);

  return {
    preset,
    resolvedArea,
    asyncArea,
    setAsyncArea,
    isResolving,
    resolutionFailed,
    resolutionError,
    suggestions,
    isAutocompleteOpen,
    setIsAutocompleteOpen,
    activeSuggestionIndex,
    setActiveSuggestionIndex,
    closeAutocomplete,
    clearAutocomplete,
  };
}
