"use client";

import dynamic from "next/dynamic";
import type { Competitor } from "@/lib/scoring";

const DynamicMap = dynamic(
  () => import("./discovery-map").then((m) => m.DiscoveryMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-80 animate-pulse items-center justify-center rounded-xl border border-border bg-muted/40 text-sm text-muted-foreground">
        Loading map…
      </div>
    ),
  },
);

export function MapWrapper({
  competitors,
}: {
  competitors: Competitor[];
}) {
  return (
    <div className="h-full min-h-80 overflow-hidden rounded-xl border border-border">
      <DynamicMap competitors={competitors} />
    </div>
  );
}
