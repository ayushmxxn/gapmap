export function ThemesList({
  themes,
  withheld,
}: {
  themes: { keyword: string; mentions: number; sourcePlace: string }[];
  withheld: boolean;
  reviewsExamined?: number;
}) {
  if (withheld || themes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/70 p-4 text-xs text-muted-foreground">
        Not enough customer reviews in this immediate area to highlight recurring themes with confidence.
      </div>
    );
  }

  const uniqueKeywords = Array.from(
    new Set(themes.map((t) => t.keyword.trim().toLowerCase())),
  );
  const topThemes = uniqueKeywords.slice(0, 3);
  const themeSummary =
    topThemes.length > 0
      ? `Customers frequently mention ${topThemes.join(", ")} when discussing local businesses in this area.`
      : "Recurring customer discussion topics across local businesses:";

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground leading-relaxed">
        {themeSummary}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {themes.map((t) => (
          <span
            key={`${t.keyword}-${t.sourcePlace}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-card px-2.5 py-1 text-xs text-foreground shadow-2xs transition-colors hover:bg-muted/30"
          >
            <span className="font-medium">
              {t.keyword.charAt(0).toUpperCase() + t.keyword.slice(1).toLowerCase()}
            </span>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {t.mentions}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
