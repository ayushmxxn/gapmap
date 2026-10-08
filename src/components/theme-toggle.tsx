"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Sun03Icon, Moon02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isDark = mounted && resolvedTheme === "dark";

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      type="button"
      role="switch"
      data-cuelume-toggle
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={handleToggle}
      className={cn(
        "group relative inline-flex h-[26px] w-[46px] shrink-0 cursor-pointer items-center rounded-full p-[2px] select-none outline-none transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98] before:absolute before:-inset-2 before:content-['']",
        isDark
          ? "bg-[#1c1e1c] border border-white/[0.08]"
          : "bg-[#E9E9EA] border border-black/[0.06]",
      )}
    >
      {/* Background track icons */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-[2px] flex h-[22px] w-[22px] items-center justify-center text-neutral-400 dark:text-neutral-500 transition-opacity duration-200"
      >
        <HugeiconsIcon icon={Sun03Icon} size={12} strokeWidth={2} />
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-[2px] flex h-[22px] w-[22px] items-center justify-center text-neutral-400 dark:text-neutral-500 transition-opacity duration-200"
      >
        <HugeiconsIcon icon={Moon02Icon} size={12} strokeWidth={2} />
      </span>

      {/* Sliding active thumb with active icon */}
      <motion.span
        aria-hidden="true"
        className={cn(
          "pointer-events-none relative flex h-[22px] w-[22px] items-center justify-center rounded-full",
          isDark
            ? "border border-white/[0.1] shadow-[0_2px_5px_rgba(0,0,0,0.35),0_1px_2px_rgba(0,0,0,0.2)]"
            : "border border-black/[0.04] shadow-[0_2px_5px_rgba(0,0,0,0.14),0_1px_2px_rgba(0,0,0,0.06)]",
        )}
        animate={{
          x: isDark ? 20 : 0,
          backgroundColor: isDark ? "#121312" : "#FFFFFF",
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 32,
          mass: 0.8,
        }}
      >
        <motion.span
          key={isDark ? "dark" : "light"}
          initial={{ rotate: -30, scale: 0.7, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex items-center justify-center"
        >
          {isDark ? (
            <HugeiconsIcon
              icon={Moon02Icon}
              size={12}
              strokeWidth={2}
              className="text-neutral-200"
            />
          ) : (
            <HugeiconsIcon
              icon={Sun03Icon}
              size={12}
              strokeWidth={2}
              className="text-neutral-700"
            />
          )}
        </motion.span>
      </motion.span>
    </button>
  );
}

export default ThemeToggle;
