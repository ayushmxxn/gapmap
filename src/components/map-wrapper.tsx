"use client";

import dynamic from "next/dynamic";
import type { Competitor } from "@/lib/scoring";

const DynamicMap = dynamic(
  () => import("./discovery-map").then((m) => m.DiscoveryMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-80 animate-pulse items-center justify-center rounded-2xl border border-border/60 bg-muted/20 text-xs text-muted-foreground">
        Loading map…
      </div>
    ),
  },
);

export function MapWrapper({
  competitors,
  mode = "globe",
}: {
  competitors: Competitor[];
  mode?: "globe" | "local";
}) {
  return (
    <div className="h-full min-h-[360px] overflow-hidden rounded-2xl border border-border/80 bg-muted/10 shadow-xs">
      <DynamicMap competitors={competitors} mode={mode} />
    </div>
  );
}
