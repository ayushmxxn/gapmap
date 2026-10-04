import type { Competitor } from "@/lib/scoring";
import { cn } from "@/lib/utils";

const SELECTION_LABEL: Record<string, string> = {
  anchor: "High-volume anchor",
  "weak-incumbent": "Low-rated incumbent",
  median: "Median representative",
};

export function CompetitorsTable({
  competitors,
}: {
  competitors: Competitor[];
}) {
  if (competitors.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No places found inside the scan radius.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50 text-left">
            <th className="px-3 py-2 font-medium">Place</th>
            <th className="px-3 py-2 font-medium">Rating</th>
            <th className="px-3 py-2 font-medium">Reviews</th>
            <th className="px-3 py-2 font-medium">Sampled as</th>
          </tr>
        </thead>
        <tbody>
          {competitors.map((c) => (
            <tr
              key={`${c.title}-${c.lat}-${c.lng}`}
              className="border-b border-border last:border-0"
            >
              <td className="px-3 py-2">
                <p className="font-medium">{c.title}</p>
                {c.address && (
                  <p className="text-xs text-muted-foreground">{c.address}</p>
                )}
              </td>
              <td className="px-3 py-2">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold",
                    c.rating == null
                      ? "bg-muted text-muted-foreground"
                      : c.rating >= 4.3
                        ? "bg-green-500/15 text-green-700 dark:text-green-400"
                        : c.rating >= 3.7
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                          : "bg-red-500/15 text-red-700 dark:text-red-400",
                  )}
                >
                  {c.rating != null ? c.rating.toFixed(1) : "–"}
                </span>
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {c.reviews != null ? c.reviews.toLocaleString("en-IN") : "–"}
              </td>
              <td className="px-3 py-2 text-xs text-muted-foreground">
                {c.selection ? SELECTION_LABEL[c.selection] : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
