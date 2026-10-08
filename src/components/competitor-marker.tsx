"use client";

import * as React from "react";
import { Marker } from "react-map-gl/mapbox";
import type { Competitor } from "@/types/scan";
import { pinColor } from "@/lib/map-utils";
import { cn } from "@/lib/utils";

export interface CompetitorMarkerProps {
  competitor: Competitor;
  isSelected: boolean;
  onSelect: (c: Competitor) => void;
  onHover?: (c: Competitor) => void;
  onLeave?: (c: Competitor) => void;
}

export const CompetitorMarker = React.memo(function CompetitorMarker({
  competitor,
  isSelected,
  onSelect,
  onHover,
  onLeave,
}: CompetitorMarkerProps) {
  const handleClick = React.useCallback(
    (e: { originalEvent: MouseEvent }) => {
      e.originalEvent.stopPropagation();
      onSelect(competitor);
    },
    [competitor, onSelect],
  );

  return (
    <Marker
      longitude={competitor.lng!}
      latitude={competitor.lat!}
      anchor="bottom"
      onClick={handleClick}
    >
      <button
        type="button"
        aria-label={`View competitor ${competitor.title}, rating: ${competitor.rating != null ? competitor.rating.toFixed(1) : "unrated"}`}
        aria-expanded={isSelected}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(competitor);
        }}
        onPointerEnter={() => onHover?.(competitor)}
        onPointerLeave={() => onLeave?.(competitor)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            onSelect(competitor);
          }
        }}
        className={cn(
          "flex size-6 items-center justify-center rounded-full text-[10px] font-bold text-white shadow transition-transform cursor-pointer outline-none select-none",
          isSelected && "scale-125 ring-2 ring-white dark:ring-black",
        )}
        style={{ backgroundColor: pinColor(competitor.rating) }}
        title={`${competitor.title} (${competitor.rating != null ? `${competitor.rating.toFixed(1)}★` : "Unrated"})`}
      >
        {competitor.rating != null ? competitor.rating.toFixed(1) : "–"}
      </button>
    </Marker>
  );
});
