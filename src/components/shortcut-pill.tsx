import * as React from "react";
import { cn } from "@/lib/utils";

interface ShortcutPillProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}

export function ShortcutPill({
  selected,
  className,
  children,
  ref,
  ...props
}: ShortcutPillProps) {
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex h-[29px] items-center justify-center rounded-[9px] px-2.5 text-[13px] font-medium leading-none select-none cursor-pointer transition-all duration-150 outline-none active:translate-y-px",
        selected
          ? "bg-[#18181B] text-white shadow-[0_1px_2.5px_rgba(0,0,0,0.18)] dark:bg-[#f3f4f3] dark:text-[#131413] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
          : "bg-[#F2F2F3] text-[#18181B]/90 hover:text-[#18181B] hover:bg-[#E8E8EA] shadow-[0_1px_1.5px_rgba(0,0,0,0.02)] dark:bg-[#1a1c1a] dark:text-[#d2d6d2] dark:hover:text-[#f3f4f3] dark:hover:bg-[#232623]",
        className,
      )}
      {...props}
    >
      <span>{children}</span>
    </button>
  );
}
