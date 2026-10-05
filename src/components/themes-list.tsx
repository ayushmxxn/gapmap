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
      <div className="rounded-xl border border-dashed border-border/70 p-4 text-xs text-muted-foreground">
        Not enough customer reviews in this immediate area to highlight recurring themes with confidence.
      </div>
    );
  }

  // Aggregate mentions by normalized keyword to eliminate repetitive chips
  const keywordMap = new Map<string, number>();
  for (const t of themes) {
    const key = t.keyword.trim().toLowerCase();
    keywordMap.set(key, (keywordMap.get(key) ?? 0) + t.mentions);
  }

  const aggregatedThemes = Array.from(keywordMap.entries())
    .map(([keyword, mentions]) => ({ keyword, mentions }))
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 8);

  const topThree = aggregatedThemes.slice(0, 3).map((t) => t.keyword);
  const themeSummary =
    topThree.length > 0
      ? `Customers frequently mention ${topThree.join(", ")} when discussing local businesses in this area.`
      : "Recurring customer discussion topics across local businesses.";

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground leading-relaxed">
        {themeSummary}
      </p>

      <div className="flex flex-wrap gap-2">
        {aggregatedThemes.map((t) => (
          <span
            key={t.keyword}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#f2f2f2] dark:bg-muted/60 px-3 py-1 text-xs text-foreground transition-colors hover:bg-[#eaeaea] dark:hover:bg-muted"
          >
            <span className="font-medium capitalize">{t.keyword}</span>
            <span className="text-[11px] font-normal text-muted-foreground tabular-nums">
              {t.mentions}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
