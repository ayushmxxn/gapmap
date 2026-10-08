"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Sun01Icon, Moon02Icon } from "@hugeicons/core-free-icons";
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
        "group relative inline-flex h-7 w-13 shrink-0 cursor-pointer items-center rounded-full p-0.5 select-none outline-none transition-colors duration-200 before:absolute before:-inset-2 before:content-['']",
        isDark
          ? "bg-[#151715] border border-white/9 shadow-[inset_0_1.5px_3.5px_rgba(0,0,0,0.7),inset_0_0_0_1px_rgba(255,255,255,0.03)] hover:border-white/15"
          : "bg-[#ECECED] border border-black/8 shadow-[inset_0_1px_2.5px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(0,0,0,0.02)] hover:border-black/[0.14]",
      )}
    >
      {/* Background track icons (dock stations) */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0.5 top-0.5 flex h-5.5 w-5.5 items-center justify-center text-neutral-400 dark:text-neutral-500 transition-colors duration-200"
      >
        <HugeiconsIcon icon={Sun01Icon} size={12.5} strokeWidth={2} />
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-0.5 top-0.5 flex h-5.5 w-5.5 items-center justify-center text-neutral-400 dark:text-neutral-500 transition-colors duration-200"
      >
        <HugeiconsIcon icon={Moon02Icon} size={12} strokeWidth={2} />
      </span>

      {/* Sliding tactile thumb */}
      <motion.span
        aria-hidden="true"
        className={cn(
          "pointer-events-none relative flex h-5.5 w-5.5 items-center justify-center rounded-full transition-colors duration-200",
          isDark
            ? "border border-white/16 bg-linear-to-b from-[#282a28] to-[#1f211f] shadow-[0_2px_6px_rgba(0,0,0,0.6),0_1px_2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.18)]"
            : "border border-black/8 bg-linear-to-b from-white to-[#fbfbfa] shadow-[0_2px_5px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)]",
        )}
        animate={{
          x: isDark ? 24 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 520,
          damping: 32,
          mass: 0.7,
        }}
      >
        <motion.span
          key={isDark ? "dark" : "light"}
          initial={{ rotate: isDark ? -35 : 35, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex items-center justify-center"
        >
          {isDark ? (
            <HugeiconsIcon
              icon={Moon02Icon}
              size={12}
              strokeWidth={2}
              className="text-[#f3f4f3]"
            />
          ) : (
            <HugeiconsIcon
              icon={Sun01Icon}
              size={12.5}
              strokeWidth={2}
              className="text-[#18181b]"
            />
          )}
        </motion.span>
      </motion.span>
    </button>
  );
}

export default ThemeToggle;
