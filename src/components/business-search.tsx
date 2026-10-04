"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { CATEGORIES, resolveCategory } from "@/lib/categories";
import { cn } from "@/lib/utils";

const POPULAR_SUGGESTIONS = [
  "Coworking space",
  "Pet daycare",
  "EV charging",
  "Dental clinic",
  "Yoga studio",
  "Pilates studio",
];

interface BusinessSearchProps {
  value: string;
  onSelect: (categoryId: string) => void;
  className?: string;
  placeholder?: string;
}

export function BusinessSearch({
  value,
  onSelect,
  className,
  placeholder = "Search for another business",
}: BusinessSearchProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const currentCategory = React.useMemo(
    () => resolveCategory(value),
    [value],
  );

  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSelect = (categoryString: string) => {
    onSelect(categoryString.trim());
    setIsOpen(false);
    setQuery("");
  };

  const isExactPreset = CATEGORIES.some(
    (c) => c.label.toLowerCase() === query.trim().toLowerCase(),
  );

  return (
    <div ref={containerRef} className={cn("relative min-w-0", className)}>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? query : currentCategory.label}
          placeholder={isOpen ? placeholder : currentCategory.label || placeholder}
          onFocus={() => {
            setIsOpen(true);
            setQuery("");
          }}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.trim()) {
              e.preventDefault();
              handleSelect(query);
            }
            if (e.key === "Escape") {
              setIsOpen(false);
              inputRef.current?.blur();
            }
          }}
          className="h-10 w-full min-w-36 rounded-xl border border-border bg-background px-3.5 pr-8 text-sm text-foreground transition-all placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-foreground/10"
        />
        <span className="pointer-events-none absolute right-3 text-muted-foreground">
          <HugeiconsIcon icon={Search01Icon} size={15} strokeWidth={2} />
        </span>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1.5 max-h-80 w-full min-w-64 overflow-y-auto rounded-xl border border-border/80 bg-popover/95 p-2 text-popover-foreground shadow-xl backdrop-blur-md">
          {query.trim().length > 0 && !isExactPreset && (
            <div className="mb-2 border-b border-border pb-2">
              <button
                type="button"
                onClick={() => handleSelect(query)}
                className="flex w-full items-center justify-between rounded-md bg-primary/10 px-2.5 py-2 text-left text-xs font-medium text-primary transition-colors hover:bg-primary/20"
              >
                <span>Search for &ldquo;{query.trim()}&rdquo;</span>
                <span className="text-[11px] text-muted-foreground">↵ Enter</span>
              </button>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
              Popular businesses
            </p>
            <div className="grid grid-cols-2 gap-1">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelect(c.id)}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-left text-xs transition-colors",
                    currentCategory.id === c.id
                      ? "bg-muted font-semibold text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-2.5 border-t border-border pt-2">
            <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
              Popular ideas
            </p>
            <div className="flex flex-wrap gap-1.5 p-1">
              {POPULAR_SUGGESTIONS.map((idea) => (
                <button
                  key={idea}
                  type="button"
                  onClick={() => handleSelect(idea)}
                  className="rounded-full border border-border bg-muted/30 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted hover:text-foreground"
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
