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
        "inline-flex h-[29px] items-center justify-center rounded-[9px] px-2.5 text-[13px] font-medium leading-none select-none cursor-pointer outline-none active:translate-y-px",
        selected
          ? "bg-foreground text-background shadow-[0_1px_2.5px_rgba(0,0,0,0.18)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
          : "bg-muted text-foreground/90 hover:text-foreground hover:bg-muted/80 shadow-[0_1px_1.5px_rgba(0,0,0,0.02)]",
        className,
      )}
      {...props}
    >
      <span>{children}</span>
    </button>
  );
}
