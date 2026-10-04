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
          ? "rounded-[20px] border border-black/[0.08] dark:border-white/10 bg-[#080d1a] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06),0_12px_28px_-6px_rgba(0,0,0,0.08)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_12px_36px_-12px_rgba(0,0,0,0.6)]"
          : "rounded-2xl border border-border/70 bg-muted/20 shadow-xs",
        className,
      )}
    >
      {mounted ? (
        <DiscoveryMap competitors={competitors} mode={mode} />
      ) : (
        <div className="flex h-full w-full animate-pulse items-center justify-center rounded-3xl border border-border/40 bg-[#080d1a] text-xs text-muted-foreground">
          Loading map…
        </div>
      )}
    </div>
  );
}
