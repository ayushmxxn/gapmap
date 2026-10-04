import type { Competitor } from "@/lib/scoring";
import { formatReviewCount } from "@/lib/result-utils";
import { cn } from "@/lib/utils";

export function CompetitorsTable({
  competitors,
  showAddress = false,
  showSamplingNote = false,
}: {
  competitors: Competitor[];
  showAddress?: boolean;
  showSamplingNote?: boolean;
}) {
  if (competitors.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No places found inside the scan radius.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Place</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Rating</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Reviews</th>
            </tr>
          </thead>
          <tbody>
            {competitors.map((c) => (
              <tr
                key={`${c.title}-${c.lat ?? 0}-${c.lng ?? 0}`}
                className="border-b border-border transition-colors hover:bg-muted/20 last:border-0"
              >
                <td className="px-4 py-2.5">
                  <p className="font-medium text-foreground">{c.title}</p>
                  {showAddress && c.address && (
                    <p className="text-xs text-muted-foreground">{c.address}</p>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                      c.rating == null
                        ? "bg-muted text-muted-foreground"
                        : c.rating >= 4.3
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          : c.rating >= 3.7
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                            : "bg-red-500/15 text-red-700 dark:text-red-400",
                    )}
                  >
                    {c.rating != null ? `${c.rating.toFixed(1)}★` : "–"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">
                  {c.reviews != null ? formatReviewCount(c.reviews) : "–"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showSamplingNote && (
        <details className="group rounded-lg border border-border/60 bg-muted/20 p-3 text-xs">
          <summary className="flex cursor-pointer items-center justify-between font-medium text-muted-foreground hover:text-foreground">
            <span>Why these places?</span>
            <span className="text-muted-foreground transition-transform group-open:rotate-180">
              ▾
            </span>
          </summary>
          <div className="mt-2 text-muted-foreground leading-relaxed">
            <p>
              To evaluate market health, GapMap examines high-volume anchors (to gauge maximum footfall), lower-rated businesses (to reveal customer pain points), and median establishments (for representative performance) across the scan radius.
            </p>
          </div>
        </details>
      )}
    </div>
  );
}
