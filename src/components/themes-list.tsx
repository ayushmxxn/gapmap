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
      <div className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
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
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground leading-relaxed">
        {themeSummary}
      </p>

      <div className="flex flex-wrap gap-2">
        {themes.map((t) => (
          <span
            key={`${t.keyword}-${t.sourcePlace}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3.5 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
          >
            <span className="font-medium">
              {t.keyword.charAt(0).toUpperCase() + t.keyword.slice(1).toLowerCase()}
            </span>
            <span className="text-xs text-muted-foreground">
              {t.mentions} {t.mentions === 1 ? "mention" : "mentions"}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
