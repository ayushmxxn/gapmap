import * as React from "react";
import { ScanStudio } from "@/components/scan-studio";

export default function Home() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <React.Suspense
        fallback={
          <div className="mx-auto w-full max-w-6xl px-4 py-8">
            <p className="text-muted-foreground">Loading GapMap…</p>
          </div>
        }
      >
        <ScanStudio />
      </React.Suspense>
    </div>
  );
}
