import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl border border-border bg-muted">
        <HugeiconsIcon icon={Search01Icon} size={24} strokeWidth={2} />
      </span>
      <h1 className="text-4xl font-semibold tracking-tight">GapMap</h1>
      <p className="text-lg text-muted-foreground">Find what&apos;s missing.</p>
    </main>
  );
}
