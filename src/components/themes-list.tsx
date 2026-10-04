export function ThemesList({
  themes,
  withheld,
  reviewsExamined,
}: {
  themes: { keyword: string; mentions: number; sourcePlace: string; evidence: string }[];
  withheld: boolean;
  reviewsExamined: number;
}) {
  if (withheld) {
    return (
      <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
        Insufficient review evidence ({reviewsExamined} reviews examined) —
        themes withheld rather than guessed.
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {themes.map((t) => (
        <span
          key={`${t.keyword}-${t.sourcePlace}`}
          className="rounded-full border border-border bg-muted/60 px-3 py-1.5 text-sm"
          title={`${t.sourcePlace} · ${t.evidence}`}
        >
          <span className="font-medium">{t.keyword}</span>{" "}
          <span className="text-muted-foreground">×{t.mentions}</span>
        </span>
      ))}
    </div>
  );
}
