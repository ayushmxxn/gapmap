import * as React from "react";
import type { Competitor } from "@/lib/scoring";
import { formatReviewCount } from "@/lib/result-utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

export function CompetitorsTable({
  competitors,
  showAddress = false,
  showSamplingNote = false,
  scope = "neighborhood",
  initialLimit = 6,
}: {
  competitors: Competitor[];
  showAddress?: boolean;
  showSamplingNote?: boolean;
  scope?: "city" | "neighborhood";
  initialLimit?: number;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (competitors.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">
        {scope === "city"
          ? "No places found across the selected city."
          : "No places found inside the scan radius."}
      </div>
    );
  }

  const visibleCompetitors =
    isExpanded || !initialLimit ? competitors : competitors.slice(0, initialLimit);

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-xl border border-border/70 bg-card">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/60 bg-muted/25 text-left text-muted-foreground">
              <th scope="col" className="px-3.5 py-2.5 font-normal">Place</th>
              <th scope="col" className="px-3.5 py-2.5 font-normal">Rating</th>
              <th scope="col" className="px-3.5 py-2.5 font-normal">Reviews</th>
            </tr>
          </thead>
          <tbody>
            {visibleCompetitors.map((c) => (
              <tr
                key={`${c.title}-${c.lat ?? 0}-${c.lng ?? 0}`}
                className="border-b border-border/40 last:border-0 transition-colors hover:bg-muted/25"
              >
                <td className="px-3.5 py-2.5">
                  <p className="font-medium text-foreground">{c.title}</p>
                  {showAddress && c.address && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{c.address}</p>
                  )}
                </td>
                <td className="px-3.5 py-2.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 font-medium tabular-nums",
                      c.rating == null
                        ? "text-muted-foreground"
                        : c.rating >= 4.3
                          ? "text-emerald-600 dark:text-emerald-400"
                          : c.rating >= 3.7
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-rose-600 dark:text-rose-400",
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full shrink-0",
                        c.rating == null
                          ? "bg-muted-foreground"
                          : c.rating >= 4.3
                            ? "bg-emerald-500"
                            : c.rating >= 3.7
                              ? "bg-amber-500"
                              : "bg-rose-500",
                      )}
                    />
                    {c.rating != null ? `${c.rating.toFixed(1)}★` : "–"}
                  </span>
                </td>
                <td className="px-3.5 py-2.5 tabular-nums text-muted-foreground">
                  {c.reviews != null ? formatReviewCount(c.reviews) : "–"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {initialLimit && competitors.length > initialLimit && (
        <button
          type="button"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-0.5 text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors cursor-pointer self-start py-1 outline-none"
        >
          <span>
            {isExpanded
              ? `Show fewer (top ${initialLimit})`
              : `View all ${competitors.length} businesses`}
          </span>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            size={13}
            strokeWidth={2}
            className={cn(
              "transition-transform duration-200",
              isExpanded && "rotate-180",
            )}
          />
        </button>
      )}

      {showSamplingNote && (
        <details className="group rounded-xl border border-border/70 bg-card p-3.5 text-xs shadow-2xs">
          <summary className="flex cursor-pointer items-center justify-between font-medium text-muted-foreground hover:text-foreground select-none outline-none">
            <span>Why these places?</span>
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              size={13}
              strokeWidth={2}
              className="text-muted-foreground transition-transform duration-200 group-open:rotate-180"
            />
          </summary>
          <div className="mt-2.5 border-t border-border/40 pt-2.5 text-muted-foreground leading-relaxed">
            <p>
              To evaluate market health, GapMap examines high-volume anchors (to gauge maximum footfall), lower-rated businesses (to reveal customer pain points), and median establishments (for representative performance) {scope === "city" ? "across the selected city." : "across the scan radius."}
            </p>
          </div>
        </details>
      )}
    </div>
  );
}
