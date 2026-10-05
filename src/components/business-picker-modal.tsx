"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Search01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons";
import { BUSINESS_DIRECTORY, type DirectoryGroup } from "@/lib/categories";
import { playSound } from "@/lib/sound";
import { cn } from "@/lib/utils";

const POPULAR_CHOICES = [
  "Cafe",
  "Bakery",
  "Gym",
  "Salon",
  "Restaurant",
  "Pet grooming",
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
  const [selectedCategory, setSelectedCategory] =
    React.useState<DirectoryGroup | null>(null);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const modalRef = React.useRef<HTMLDivElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Keep a stable ref to avoid effect recreation on every keystroke
  const stateRef = React.useRef({ search, selectedCategory });
  React.useEffect(() => {
    stateRef.current = { search, selectedCategory };
  }, [search, selectedCategory]);

  const handleClose = React.useCallback(() => {
    playSound("close");
    setSearch("");
    setSelectedCategory(null);
    onClose();
  }, [onClose]);

  // Reset scroll position to top whenever modal opens or view changes
  React.useEffect(() => {
    if (isOpen) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    }
  }, [isOpen, selectedCategory]);

  // Handle escape, focus trap, and bulletproof background scroll lock
  React.useEffect(() => {
    if (!isOpen) return;

    const triggerEl = triggerRef?.current;
    const scrollY = window.scrollY;
    const prevPosition = document.body.style.position;
    const prevTop = document.body.style.top;
    const prevWidth = document.body.style.width;
    const prevOverflow = document.body.style.overflow;

    // Strict mobile scroll lock preventing background page jumping
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";

    // Auto-focus input on desktop only; avoid jarring keyboard popup on mobile
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    let timer: NodeJS.Timeout | null = null;
    if (!isMobile) {
      timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (stateRef.current.search) {
          setSearch("");
          return;
        }
        if (stateRef.current.selectedCategory) {
          setSelectedCategory(null);
          return;
        }
        handleClose();
        return;
      }

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
      if (timer) clearTimeout(timer);
      document.body.style.position = prevPosition;
      document.body.style.top = prevTop;
      document.body.style.width = prevWidth;
      document.body.style.overflow = prevOverflow;
      window.scrollTo(0, scrollY);
      document.removeEventListener("keydown", handleKeyDown);
      triggerEl?.focus();
    };
  }, [isOpen, handleClose, triggerRef]);

  const cleanSearch = search.trim().toLowerCase();
  const isSearching = cleanSearch.length > 0;

  // Flattened directory items for search
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
    playSound("select");
    onSelectBusiness(label.trim());
    handleClose();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (cleanSearch) {
        const topMatch = matchingItems[0];
        if (topMatch) {
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
      data-cuelume-close
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-150 pt-[max(0.75rem,env(safe-area-inset-top,0px))] sm:pt-6 overflow-hidden overscroll-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-[460px] max-h-[calc(100dvh-1.5rem)] sm:max-h-[520px] flex flex-col rounded-[22px] border border-black/[0.08] dark:border-white/10 bg-background p-4 sm:p-5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_60px_-16px_rgba(0,0,0,0.7)] backdrop-blur-xl animate-in zoom-in-95 duration-150 overflow-hidden"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-2.5 sm:pb-3 shrink-0">
          <h2
            id="modal-title"
            className="text-sm font-semibold tracking-tight text-foreground"
          >
            Choose business
          </h2>
          <button
            type="button"
            data-cuelume-close
            aria-label="Close dialog"
            onClick={handleClose}
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground/70 hover:text-foreground hover:bg-[#f2f2f2] dark:hover:bg-[#1a1c1a] transition-colors cursor-pointer active:scale-95"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={15} strokeWidth={2} />
          </button>
        </div>

        {/* Homepage-matched Search Input */}
        <div className="relative mb-3 sm:mb-3.5 flex items-center shrink-0">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            strokeWidth={1.8}
            className="pointer-events-none absolute left-3.5 text-muted-foreground/60 select-none"
          />
          <input
            ref={inputRef}
            type="text"
            data-cuelume-type
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (selectedCategory) setSelectedCategory(null);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search a business type..."
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="search"
            className="h-[45px] w-full rounded-[16px] border border-black/[0.06] dark:border-white/[0.08] bg-[#f4f4f6] dark:bg-[#191b19] pl-10 pr-10 text-[16px] sm:text-[14px] leading-5 font-normal text-[#18181b] dark:text-[#f3f4f3] placeholder:text-[#18181b]/45 dark:placeholder:text-[#949a94]/60 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),inset_0_2px_4px_0_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),inset_0_2px_4px_0_rgba(0,0,0,0.4)] transition-all duration-150 hover:bg-[#efeff2] dark:hover:bg-[#1d201d] hover:border-black/[0.09] dark:hover:border-white/[0.13] outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:bg-[#f8f8fa] dark:focus-visible:bg-[#212421] focus-visible:border-black/[0.12] dark:focus-visible:border-white/[0.18] focus-visible:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8),inset_0_2px_4px_0_rgba(0,0,0,0.06)] dark:focus-visible:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),inset_0_2px_4px_0_rgba(0,0,0,0.4)]"
          />
          {search.length > 0 && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setSearch("");
                inputRef.current?.focus();
              }}
              className="absolute right-2.5 flex size-6.5 items-center justify-center rounded-full text-muted-foreground/50 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition-colors active:scale-95"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Scrollable Content Area */}
        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-0.5"
        >
          {/* 1. SEARCH RESULTS MODE */}
          {isSearching ? (
            <div className="space-y-2">
              {cleanSearch.length > 0 && !exactMatchExists && (
                <button
                  type="button"
                  data-cuelume-select
                  onClick={() => handleSelect(search.trim())}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#f2f2f2] hover:bg-[#e8e8e8] text-[#18181b] dark:bg-[#1a1c1a] dark:hover:bg-[#232623] dark:text-[#d2d6d2] text-xs sm:text-sm font-medium transition-colors cursor-pointer"
                >
                  <span className="truncate">
                    Use &ldquo;<span className="font-semibold">{search.trim()}</span>&rdquo; as custom business
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    ↵
                  </span>
                </button>
              )}

              {matchingItems.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {matchingItems.map((item) => {
                    const isSelected =
                      currentBusinessLabel?.toLowerCase() ===
                      item.label.toLowerCase();
                    return (
                      <button
                        key={`${item.groupName}-${item.id}`}
                        type="button"
                        data-cuelume-select
                        onClick={() => handleSelect(item.label)}
                        className={cn(
                          "p-2.5 rounded-xl flex flex-col items-start justify-center text-left transition-all cursor-pointer select-none active:scale-[0.98]",
                          isSelected
                            ? "bg-[#18181B] text-white shadow-[0_1px_2.5px_rgba(0,0,0,0.18)] dark:bg-[#f3f4f3] dark:text-[#131413]"
                            : "bg-[#f2f2f2] hover:bg-[#e8e8e8] text-[#18181b] dark:bg-[#1a1c1a] dark:hover:bg-[#232623] dark:text-[#d2d6d2]",
                        )}
                      >
                        <span className="text-xs sm:text-[13px] font-medium truncate w-full">
                          {item.label}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] truncate w-full mt-0.5",
                            isSelected ? "text-white/75 dark:text-[#131413]/75" : "text-muted-foreground",
                          )}
                        >
                          {item.groupName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No predefined business types found.
                </div>
              )}
            </div>
          ) : selectedCategory ? (
            /* 2. CATEGORY BUSINESS TYPES (COMPACT GRID) */
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1 pr-1.5 rounded-md group"
                >
                  <HugeiconsIcon
                    icon={ArrowLeft01Icon}
                    size={14}
                    strokeWidth={2}
                    className="group-hover:-translate-x-0.5 transition-transform"
                  />
                  Back
                </button>
                <span className="text-muted-foreground/30 text-xs">/</span>
                <span className="text-xs font-medium text-foreground">
                  {selectedCategory.name}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {selectedCategory.items.map((item) => {
                  const isSelected =
                    currentBusinessLabel?.toLowerCase() ===
                    item.label.toLowerCase();
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-cuelume-select
                      onClick={() => handleSelect(item.label)}
                      className={cn(
                        "min-h-[42px] px-3 py-2 rounded-xl flex items-center justify-center text-center text-xs sm:text-[13px] font-medium transition-all cursor-pointer select-none active:scale-[0.98]",
                        isSelected
                          ? "bg-[#18181B] text-white shadow-[0_1px_2.5px_rgba(0,0,0,0.18)] dark:bg-[#f3f4f3] dark:text-[#131413]"
                          : "bg-[#f2f2f2] hover:bg-[#e8e8e8] text-[#18181b]/90 hover:text-[#18181b] dark:bg-[#1a1c1a] dark:hover:bg-[#232623] dark:text-[#d2d6d2] dark:hover:text-[#f3f4f3]",
                      )}
                    >
                      <span className="leading-snug">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* 3. DEFAULT BROWSING: 6 POPULAR GRID + VISUAL CATEGORY GRID */
            <div className="space-y-4">
              {/* Popular choices (6 compact grid items) */}
              <div>
                <span className="text-xs font-medium text-muted-foreground block mb-2 select-none">
                  Popular
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {POPULAR_CHOICES.map((choice) => {
                    const isSelected =
                      currentBusinessLabel?.toLowerCase() ===
                      choice.toLowerCase();
                    return (
                      <button
                        key={choice}
                        type="button"
                        data-cuelume-select
                        onClick={() => handleSelect(choice)}
                        className={cn(
                          "h-9.5 px-2.5 rounded-xl text-xs font-medium flex items-center justify-center transition-all cursor-pointer select-none active:scale-[0.98]",
                          isSelected
                            ? "bg-[#18181B] text-white shadow-[0_1px_2.5px_rgba(0,0,0,0.18)] dark:bg-[#f3f4f3] dark:text-[#131413]"
                            : "bg-[#f2f2f2] hover:bg-[#e8e8e8] text-[#18181b]/90 hover:text-[#18181b] dark:bg-[#1a1c1a] dark:hover:bg-[#232623] dark:text-[#d2d6d2] dark:hover:text-[#f3f4f3]",
                        )}
                      >
                        {choice}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Visual Category Grid (2 columns x 3 rows) */}
              <div>
                <span className="text-xs font-medium text-muted-foreground block mb-2 select-none">
                  Categories
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {BUSINESS_DIRECTORY.map((group) => (
                    <button
                      key={group.name}
                      type="button"
                      onClick={() => setSelectedCategory(group)}
                      className="min-h-[44px] h-auto py-2.5 px-3 rounded-xl flex items-center justify-between text-left bg-[#f2f2f2] hover:bg-[#e8e8e8] text-[#18181b] dark:bg-[#1a1c1a] dark:hover:bg-[#232623] dark:text-[#d2d6d2] transition-all cursor-pointer group active:scale-[0.98]"
                    >
                      <span className="text-xs sm:text-[13px] font-medium leading-snug pr-1">
                        {group.name}
                      </span>
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        size={14}
                        strokeWidth={2}
                        className="text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 ml-auto"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
