"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { motion } from "motion/react";
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
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={handleToggle}
      className={cn(
        "group relative inline-flex h-[22px] w-[38px] shrink-0 cursor-pointer items-center rounded-full p-[2px] select-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors duration-300 ease-out",
        isDark ? "bg-[#E5E5E5]" : "bg-[#E9E9EA] border border-black/[0.04]",
      )}
    >
      <motion.span
        aria-hidden="true"
        className="pointer-events-none block h-[18px] w-[18px] rounded-full shadow-[0_2px_5px_rgba(0,0,0,0.18),0_1px_1px_rgba(0,0,0,0.08)]"
        animate={{
          x: isDark ? 16 : 0,
          backgroundColor: isDark ? "#0E0F0E" : "#FFFFFF",
        }}
        transition={{
          type: "spring",
          stiffness: 520,
          damping: 34,
          mass: 0.8,
        }}
      />
    </button>
  );
}

export default ThemeToggle;
