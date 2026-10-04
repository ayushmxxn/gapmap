"use client";

import * as React from "react";
import { DiscoveryMap } from "./discovery-map";
import type { Competitor } from "@/lib/scoring";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

export function MapWrapper({
  competitors,
  mode = "globe",
  className,
}: {
  competitors: Competitor[];
  mode?: "globe" | "local";
  className?: string;
}) {
  const isGlobe = mode === "globe";
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  return (
    <div
      className={cn(
        "relative w-full h-full overflow-hidden transition-colors",
        isGlobe
          ? "rounded-[20px] bg-[#080d1a]"
          : "rounded-2xl border border-border/70 bg-muted/20 shadow-xs",
        className,
      )}
    >
      {mounted ? (
        <DiscoveryMap competitors={competitors} mode={mode} />
      ) : (
        <div className="flex h-full w-full animate-pulse items-center justify-center rounded-3xl bg-[#080d1a] text-xs text-muted-foreground">
          Loading map…
        </div>
      )}
    </div>
  );
}
