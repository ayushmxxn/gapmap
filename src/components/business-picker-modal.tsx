"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { BUSINESS_DIRECTORY } from "@/lib/categories";
import { cn } from "@/lib/utils";

const POPULAR_CHOICES = [
  "Cafe",
  "Bakery",
  "Gym",
  "Salon",
  "Laundry",
  "Pet grooming",
  "Restaurant",
  "EV charging station",
  "Bookstore",
  "Yoga studio",
  "Dental clinic",
  "Car wash",
];

interface BusinessPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBusiness: (businessLabel: string) => void;
  currentBusinessLabel?: string;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

export function BusinessPickerModal({
  isOpen,
  onClose,
  onSelectBusiness,
  currentBusinessLabel,
  triggerRef,
}: BusinessPickerModalProps) {
  const [search, setSearch] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const modalRef = React.useRef<HTMLDivElement>(null);

  const handleClose = React.useCallback(() => {
    setSearch("");
    onClose();
  }, [onClose]);

  // Prevent background scrolling and handle escape & focus trap
  React.useEffect(() => {
    if (!isOpen) return;

    const triggerEl = triggerRef?.current;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    // Focus input on open
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        return;
      }

      // Focus trap within modal
      if (e.key === "Tab" && modalRef.current) {
        const focusableEls = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const firstEl = focusableEls[0];
        const lastEl = focusableEls[focusableEls.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl?.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl?.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      triggerEl?.focus();
    };
  }, [isOpen, handleClose, triggerRef]);

  // Track visual viewport on mobile devices (keyboard opening/closing, orientation)
  const [viewportHeight, setViewportHeight] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    const updateHeight = () => {
      if (typeof window === "undefined") return;
      const vv = window.visualViewport;
      if (vv) {
        setViewportHeight(Math.floor(vv.height));
      } else {
        setViewportHeight(window.innerHeight);
      }
    };

    updateHeight();
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", updateHeight);
      vv.addEventListener("scroll", updateHeight);
    }
    window.addEventListener("resize", updateHeight);
    window.addEventListener("orientationchange", updateHeight);

    return () => {
      if (vv) {
        vv.removeEventListener("resize", updateHeight);
        vv.removeEventListener("scroll", updateHeight);
      }
      window.removeEventListener("resize", updateHeight);
      window.removeEventListener("orientationchange", updateHeight);
    };
  }, [isOpen]);

  const cleanSearch = search.trim().toLowerCase();

  // All flat items for filtering
  const allItems = React.useMemo(() => {
    return BUSINESS_DIRECTORY.flatMap((g) =>
      g.items.map((i) => ({ ...i, groupName: g.name })),
    );
  }, []);

  const matchingItems = React.useMemo(() => {
    if (!cleanSearch) return [];
    return allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(cleanSearch) ||
        item.groupName.toLowerCase().includes(cleanSearch),
    );
  }, [cleanSearch, allItems]);

  const exactMatchExists = allItems.some(
    (item) => item.label.toLowerCase() === cleanSearch,
  );

  const handleSelect = (label: string) => {
    onSelectBusiness(label.trim());
    onClose();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (cleanSearch) {
        // If there's an exact or top match, prefer that; otherwise use custom text
        const topMatch = matchingItems[0];
        if (topMatch && topMatch.label.toLowerCase() === cleanSearch) {
          handleSelect(topMatch.label);
        } else {
          handleSelect(search.trim());
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-150 touch-none pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pl-[max(0.75rem,env(safe-area-inset-left,0px))] pr-[max(0.75rem,env(safe-area-inset-right,0px))]"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        ref={modalRef}
        style={{
          maxHeight: viewportHeight
            ? `${Math.min(580, viewportHeight - 24)}px`
            : "min(85dvh, 580px)",
        }}
        className="w-full max-w-[540px] flex flex-col rounded-[22px] border border-border/80 dark:border-white/10 bg-background/98 p-4 sm:p-6 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_60px_-16px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.08)] backdrop-blur-2xl overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/50">
          <div>
            <h2
              id="modal-title"
              className="text-base sm:text-lg font-semibold tracking-tight text-foreground"
            >
              Choose a business
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select a popular type or type any custom business
            </p>
          </div>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={handleClose}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer active:scale-95"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={15} strokeWidth={2} />
          </button>
        </div>

        {/* Prominent Search Field */}
        <div className="relative mt-4 flex items-center">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            strokeWidth={1.8}
            className="pointer-events-none absolute left-3.5 text-muted-foreground/60 select-none"
          />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search or type any business…"
            autoComplete="off"
            spellCheck={false}
            className="h-11 w-full rounded-[13px] border border-border/80 dark:border-white/10 bg-card pl-10 pr-9 text-base sm:text-sm text-foreground placeholder:text-muted-foreground/50 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3)] focus-visible:outline-none focus-visible:border-foreground/30 dark:focus-visible:border-white/30 focus-visible:ring-2 focus-visible:ring-ring/15 transition-all"
          />
          {search.length > 0 && (
            <button
              type="button"
              aria-label="Clear search input"
              onClick={() => {
                setSearch("");
                inputRef.current?.focus();
              }}
              className="absolute right-2.5 flex size-6.5 items-center justify-center rounded-full text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 cursor-pointer transition-colors active:scale-95"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Custom Business Selection Banner (Active when typing) */}
        {cleanSearch.length > 0 && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => handleSelect(search.trim())}
              className="w-full flex items-center justify-between rounded-xl border border-primary/20 bg-primary/8 px-4 py-2.5 text-left text-xs sm:text-sm text-foreground hover:bg-primary/12 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-muted-foreground">Use:</span>
                <span className="font-medium text-foreground truncate">
                  &ldquo;{search.trim()}&rdquo;
                </span>
                {!exactMatchExists && (
                  <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    Custom
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground/80 shrink-0 flex items-center gap-1 group-hover:text-foreground">
                Select <kbd className="rounded border border-border/70 px-1 text-[10px]">↵</kbd>
              </span>
            </button>
          </div>
        )}

        {/* Scrollable Content: Popular Choices & Categorized Directory */}
        <div className="mt-4 flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1 space-y-5">
          {/* If searching: show filtered results */}
          {cleanSearch.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Matching suggestions ({matchingItems.length})
              </p>
              {matchingItems.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {matchingItems.map((item) => {
                    const isSelected =
                      currentBusinessLabel?.toLowerCase() ===
                      item.label.toLowerCase();

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelect(item.label)}
                        className={cn(
                          "rounded-[9px] px-3 py-1.5 text-xs font-medium transition-all duration-150 cursor-pointer select-none active:translate-y-px outline-none focus-visible:ring-2 focus-visible:ring-ring/25",
                          isSelected
                            ? "bg-foreground text-background shadow-[0_1px_2.5px_rgba(0,0,0,0.18)] border border-transparent"
                            : "bg-card text-foreground/80 hover:text-foreground hover:bg-secondary/60 border border-border/70 shadow-[0_1px_1.5px_rgba(0,0,0,0.03)] dark:bg-card/80 dark:border-white/8 dark:hover:border-white/15",
                        )}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  <p>No predefined business matches &ldquo;{search}&rdquo;.</p>
                  <p className="mt-1">
                    Press <kbd className="rounded border border-border px-1 py-0.5 text-[10px] font-semibold">Enter</kbd> or click the box above to use it as a custom business.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Default browsing: Popular pills + Grouped categories */
            <>
              {/* Popular quick picks */}
              <div>
                <p className="text-xs font-semibold text-foreground/85 mb-2.5">
                  Popular choices
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_CHOICES.map((choice) => {
                    const isSelected =
                      currentBusinessLabel?.toLowerCase() ===
                      choice.toLowerCase();

                    return (
                      <button
                        key={choice}
                        type="button"
                        onClick={() => handleSelect(choice)}
                        className={cn(
                          "rounded-[9px] px-3 py-1.5 text-xs font-medium transition-all duration-150 cursor-pointer select-none active:translate-y-px outline-none focus-visible:ring-2 focus-visible:ring-ring/25",
                          isSelected
                            ? "bg-foreground text-background shadow-[0_1px_2.5px_rgba(0,0,0,0.18)] border border-transparent"
                            : "bg-card text-foreground/80 hover:text-foreground hover:bg-secondary/60 border border-border/70 shadow-[0_1px_1.5px_rgba(0,0,0,0.03)] dark:bg-card/80 dark:border-white/8 dark:hover:border-white/15",
                        )}
                      >
                        {choice}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Categorized groups */}
              <div className="pt-2 border-t border-border/40 space-y-4">
                <p className="text-xs font-semibold text-foreground/85">
                  Browse by category
                </p>
                {BUSINESS_DIRECTORY.map((group) => (
                  <div key={group.name} className="space-y-1.5">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {group.name}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {group.items.map((item) => {
                        const isSelected =
                          currentBusinessLabel?.toLowerCase() ===
                          item.label.toLowerCase();

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelect(item.label)}
                            className={cn(
                              "rounded-[8px] px-2.5 py-1 text-xs font-medium transition-all duration-150 cursor-pointer select-none active:translate-y-px outline-none focus-visible:ring-2 focus-visible:ring-ring/25",
                              isSelected
                                ? "bg-foreground text-background shadow-[0_1px_2px_rgba(0,0,0,0.18)] border border-transparent"
                                : "bg-card/90 text-foreground/80 hover:text-foreground hover:bg-secondary/60 border border-border/60 shadow-[0_1px_1px_rgba(0,0,0,0.02)] dark:bg-card/60 dark:border-white/6 dark:hover:border-white/12",
                            )}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
