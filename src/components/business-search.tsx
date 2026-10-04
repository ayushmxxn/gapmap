"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  Cancel01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { CATEGORIES, resolveCategory } from "@/lib/categories";
import { ShortcutPill } from "@/components/shortcut-pill";
import { cn } from "@/lib/utils";

export const POPULAR_BUSINESSES = [
  { id: "cafe", label: "Cafe" },
  { id: "bakery", label: "Bakery" },
  { id: "salon", label: "Salon" },
  { id: "gym", label: "Gym" },
  { id: "laundromat", label: "Laundry" },
  { id: "pet-grooming", label: "Pet grooming" },
] as const;

interface BusinessSearchProps {
  value: string;
  onSelect: (categoryId: string) => void;
  className?: string;
  placeholder?: string;
  showQuickChoices?: boolean;
}

interface ComboboxItem {
  id: string;
  value: string;
  label: string;
  isCustom?: boolean;
}

type PopoverPlacement = "bottom" | "top";

interface PopoverPosition {
  placement: PopoverPlacement;
  maxHeight: number;
}

const VIEWPORT_MARGIN = 12;
const INPUT_GAP = 6;
const IDEAL_DROPDOWN_HEIGHT = 220;
const MIN_DROPDOWN_HEIGHT = 100;

export function BusinessSearch({
  value,
  onSelect,
  className,
  placeholder = "Search for a business…",
  showQuickChoices = true,
}: BusinessSearchProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [isFocused, setIsFocused] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState<number>(-1);
  const [popoverPosition, setPopoverPosition] = React.useState<PopoverPosition>({
    placement: "bottom",
    maxHeight: IDEAL_DROPDOWN_HEIGHT,
  });

  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listboxRef = React.useRef<HTMLUListElement>(null);

  const currentCategory = React.useMemo(
    () => resolveCategory(value),
    [value],
  );

  const updatePopoverPosition = React.useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const vh = window.visualViewport
      ? window.visualViewport.height
      : window.innerHeight;
    const viewportTop = window.visualViewport
      ? window.visualViewport.offsetTop
      : 0;

    const spaceBelow =
      vh - (rect.bottom - viewportTop) - VIEWPORT_MARGIN - INPUT_GAP;
    const spaceAbove =
      rect.top - viewportTop - VIEWPORT_MARGIN - INPUT_GAP;

    let placement: PopoverPlacement = "bottom";
    let maxHeight = IDEAL_DROPDOWN_HEIGHT;

    if (spaceBelow >= IDEAL_DROPDOWN_HEIGHT) {
      placement = "bottom";
      maxHeight = Math.min(IDEAL_DROPDOWN_HEIGHT, Math.floor(spaceBelow));
    } else if (spaceAbove >= IDEAL_DROPDOWN_HEIGHT) {
      placement = "top";
      maxHeight = Math.min(IDEAL_DROPDOWN_HEIGHT, Math.floor(spaceAbove));
    } else if (spaceAbove > spaceBelow) {
      placement = "top";
      maxHeight = Math.max(MIN_DROPDOWN_HEIGHT, Math.floor(spaceAbove));
    } else {
      placement = "bottom";
      maxHeight = Math.max(MIN_DROPDOWN_HEIGHT, Math.floor(spaceBelow));
    }

    setPopoverPosition((prev) => {
      if (prev.placement === placement && prev.maxHeight === maxHeight) {
        return prev;
      }
      return { placement, maxHeight };
    });
  }, []);

  React.useLayoutEffect(() => {
    if (!isOpen) return;

    updatePopoverPosition();

    const handleUpdate = () => {
      updatePopoverPosition();
    };

    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, {
      passive: true,
      capture: true,
    });
    window.addEventListener("orientationchange", handleUpdate);

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", handleUpdate);
      vv.addEventListener("scroll", handleUpdate);
    }

    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
      window.removeEventListener("orientationchange", handleUpdate);
      if (vv) {
        vv.removeEventListener("resize", handleUpdate);
        vv.removeEventListener("scroll", handleUpdate);
      }
    };
  }, [isOpen, updatePopoverPosition]);

  const cleanQuery = query.trim().toLowerCase();

  const matchingCategories = React.useMemo(() => {
    if (!cleanQuery) return [];
    return CATEGORIES.filter((c) =>
      c.label.toLowerCase().includes(cleanQuery),
    );
  }, [cleanQuery]);

  const showCustomOption =
    cleanQuery.length > 0 &&
    !CATEGORIES.some((c) => c.label.toLowerCase() === cleanQuery);

  const items = React.useMemo<ComboboxItem[]>(() => {
    const list: ComboboxItem[] = [];
    if (showCustomOption) {
      list.push({
        id: "custom-search-option",
        value: query.trim(),
        label: `Search for "${query.trim()}"`,
        isCustom: true,
      });
    }
    for (const c of matchingCategories) {
      list.push({
        id: c.id,
        value: c.id,
        label: c.label,
      });
    }
    return list;
  }, [showCustomOption, query, matchingCategories]);

  // Sync active item scrolling
  React.useEffect(() => {
    if (activeIndex >= 0 && listboxRef.current) {
      const activeEl = listboxRef.current.querySelector(
        `[data-combobox-index="${activeIndex}"]`,
      );
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [activeIndex]);

  // Close on outside click
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setQuery("");
        setIsFocused(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSelect = React.useCallback(
    (selectedVal: string) => {
      onSelect(selectedVal.trim());
      setIsOpen(false);
      setQuery("");
      setIsFocused(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    },
    [onSelect],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "Enter") {
        e.preventDefault();
        if (query.trim()) {
          handleSelect(query.trim());
        }
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (items.length > 0) {
        setActiveIndex((prev) => (prev < 0 ? 0 : (prev + 1) % items.length));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (items.length > 0) {
        setActiveIndex((prev) => (prev <= 0 ? items.length - 1 : prev - 1));
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && items[activeIndex]) {
        handleSelect(items[activeIndex].value);
      } else if (query.trim()) {
        handleSelect(query.trim());
      } else {
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setQuery("");
      setActiveIndex(-1);
      inputRef.current?.blur();
    } else if (e.key === "Tab") {
      setIsOpen(false);
      setQuery("");
      setActiveIndex(-1);
    }
  };

  const inputValue = isFocused ? query : currentCategory.label;

  return (
    <div ref={containerRef} className={cn("relative min-w-0 font-sans", className)}>
      {/* Universal Search Input */}
      <div className="relative flex items-center">
        <HugeiconsIcon
          icon={Search01Icon}
          size={15}
          strokeWidth={1.8}
          className="pointer-events-none absolute left-3.5 text-muted-foreground/60 select-none"
        />

        <input
          ref={inputRef}
          id="business-search-input"
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="business-options-list"
          aria-activedescendant={
            activeIndex >= 0 && items[activeIndex]
              ? `business-option-${items[activeIndex].id}`
              : undefined
          }
          aria-label="What are you looking for?"
          value={inputValue}
          placeholder={placeholder}
          onFocus={() => {
            setIsFocused(true);
            setQuery(currentCategory.label);
            setActiveIndex(-1);
            setTimeout(() => {
              inputRef.current?.select();
            }, 0);
          }}
          onBlur={() => {
            setTimeout(() => {
              if (!containerRef.current?.contains(document.activeElement)) {
                setIsFocused(false);
                setIsOpen(false);
                setQuery("");
              }
            }, 150);
          }}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            if (val.trim().length > 0) {
              setIsOpen(true);
              setActiveIndex(0);
            } else {
              setIsOpen(false);
              setActiveIndex(-1);
            }
          }}
          onKeyDown={handleKeyDown}
          className="h-10 w-full min-w-36 rounded-xl border border-border/70 bg-card pl-9 pr-9 text-sm text-foreground transition-all placeholder:text-muted-foreground/60 hover:border-border focus-visible:outline-none focus-visible:border-border focus-visible:ring-2 focus-visible:ring-ring/20"
        />

        {query.length > 0 && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
              setActiveIndex(-1);
              inputRef.current?.focus();
            }}
            className="absolute right-3 flex size-5 items-center justify-center rounded-full text-muted-foreground/60 hover:text-foreground cursor-pointer transition-colors"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={13} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Dynamic Popover: Only opens when actively typing suggestions */}
      {isOpen && items.length > 0 && (
        <div
          style={{
            ...(popoverPosition.placement === "top"
              ? {
                  bottom: "100%",
                  marginBottom: `${INPUT_GAP}px`,
                  top: "auto",
                  marginTop: 0,
                }
              : {
                  top: "100%",
                  marginTop: `${INPUT_GAP}px`,
                  bottom: "auto",
                  marginBottom: 0,
                }),
            maxHeight: `${popoverPosition.maxHeight}px`,
          }}
          className={cn(
            "absolute left-0 z-50 w-full min-w-64 overflow-hidden rounded-xl border border-border/80 bg-popover p-1 text-popover-foreground shadow-md",
            popoverPosition.placement === "top"
              ? "origin-bottom animate-in fade-in-0 zoom-in-95"
              : "origin-top animate-in fade-in-0 zoom-in-95",
          )}
        >
          <ul
            ref={listboxRef}
            id="business-options-list"
            role="listbox"
            aria-label="Suggested businesses"
            className="flex flex-col gap-0.5 overflow-y-auto overscroll-contain"
            style={{
              maxHeight: `calc(${popoverPosition.maxHeight}px - 8px)`,
            }}
          >
            {showCustomOption && items[0]?.isCustom && (
              <li
                id="business-option-custom-search-option"
                role="option"
                aria-selected={activeIndex === 0}
                data-combobox-index={0}
                onMouseEnter={() => setActiveIndex(0)}
                onClick={() => handleSelect(items[0].value)}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2 text-sm text-foreground transition-colors cursor-pointer",
                  activeIndex === 0 ? "bg-muted/70" : "hover:bg-muted/40",
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <HugeiconsIcon
                    icon={Search01Icon}
                    size={14}
                    strokeWidth={1.8}
                    className="text-muted-foreground/70 shrink-0"
                  />
                  <span className="truncate">{items[0].label}</span>
                </div>
                <kbd className="text-[10px] text-muted-foreground/60 font-mono px-1.5 py-0.5 rounded bg-muted/60 shrink-0">
                  ↵
                </kbd>
              </li>
            )}

            {matchingCategories.map((c) => {
              const itemIndex = items.findIndex((it) => it.id === c.id);
              const isHighlighted = activeIndex === itemIndex;
              const isSelected =
                currentCategory.id.toLowerCase() === c.id.toLowerCase();

              return (
                <li
                  key={c.id}
                  id={`business-option-${c.id}`}
                  role="option"
                  aria-selected={isSelected}
                  data-combobox-index={itemIndex}
                  onMouseEnter={() => setActiveIndex(itemIndex)}
                  onClick={() => handleSelect(c.id)}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer text-foreground",
                    isHighlighted ? "bg-muted/70" : "hover:bg-muted/40",
                    isSelected && "font-medium",
                  )}
                >
                  <span className="truncate">{c.label}</span>
                  {isSelected && (
                    <HugeiconsIcon
                      icon={Tick02Icon}
                      size={14}
                      strokeWidth={2.2}
                      className="text-foreground shrink-0"
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* 6 Popular Businesses Compact Squircle Shortcuts Directly Below */}
      {showQuickChoices && (
        <div
          className="mt-2 flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label="Popular business shortcuts"
        >
          {POPULAR_BUSINESSES.map((b) => {
            const isSelected =
              currentCategory.id.toLowerCase() === b.id.toLowerCase() ||
              currentCategory.label.toLowerCase() === b.label.toLowerCase();

            return (
              <ShortcutPill
                key={b.id}
                selected={isSelected}
                onClick={() => handleSelect(b.id)}
              >
                {b.label}
              </ShortcutPill>
            );
          })}
        </div>
      )}
    </div>
  );
}
