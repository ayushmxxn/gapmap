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
        "inline-flex h-[29px] items-center justify-center rounded-[9px] px-2.5 text-[13px] font-medium leading-none select-none cursor-pointer transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/30 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#111215] active:translate-y-px",
        selected
          ? "bg-[#18181B] text-white shadow-[0_1px_2.5px_rgba(0,0,0,0.18)]"
          : "bg-[#F2F2F3] text-[#18181B]/90 hover:text-[#18181B] hover:bg-[#E8E8EA] shadow-[0_1px_1.5px_rgba(0,0,0,0.02)] dark:bg-card dark:text-foreground/85 dark:hover:text-foreground",
        className,
      )}
      {...props}
    >
      <span>{children}</span>
    </button>
  );
}
