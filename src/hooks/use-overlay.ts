"use client";

import * as React from "react";
import { playSound } from "@/lib/sound";

export interface UseOverlayOptions {
  isOpen: boolean;
  onClose: () => void;
  containerRef: React.RefObject<HTMLElement | null>;
  triggerRef?: React.RefObject<HTMLElement | null>;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  /** Optional custom Escape handler before closing. Return true to prevent default onClose. */
  onEscape?: () => boolean | void;
  /** Whether to play sound on Escape close. Default true. */
  playCloseSound?: boolean;
  /** Whether to prevent auto-focus on small screens (mobile keyboard avoidance). Default false. */
  preventMobileAutoFocus?: boolean;
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useOverlay({
  isOpen,
  onClose,
  containerRef,
  triggerRef,
  initialFocusRef,
  onEscape,
  playCloseSound = true,
  preventMobileAutoFocus = false,
}: UseOverlayOptions): void {
  const triggerElRef = React.useRef<HTMLElement | null>(null);

  // Keep callback refs stable to avoid reattaching listeners
  const onCloseRef = React.useRef(onClose);
  const onEscapeRef = React.useRef(onEscape);

  React.useEffect(() => {
    onCloseRef.current = onClose;
    onEscapeRef.current = onEscape;
  });

  React.useEffect(() => {
    if (!isOpen) return;

    // 1. Capture previously focused element
    const triggerSnapshot = triggerRef?.current;
    triggerElRef.current =
      triggerSnapshot ?? (document.activeElement as HTMLElement | null);

    // 2. Auto-focus initial element with mobile check
    const isMobile =
      preventMobileAutoFocus &&
      typeof window !== "undefined" &&
      window.innerWidth < 640;

    let timer: NodeJS.Timeout | null = null;
    if (!isMobile) {
      timer = setTimeout(() => {
        if (initialFocusRef?.current) {
          initialFocusRef.current.focus();
        } else if (containerRef.current) {
          const firstFocusable =
            containerRef.current.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
          firstFocusable?.focus();
        }
      }, 50);
    }

    // 3. Keydown handling (Escape + Focus Trap)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        const intercepted = onEscapeRef.current ? onEscapeRef.current() : false;
        if (!intercepted) {
          if (playCloseSound) {
            playSound("close");
          }
          onCloseRef.current();
        }
        return;
      }

      if (e.key === "Tab" && containerRef.current) {
        const focusableEls =
          containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusableEls.length === 0) return;

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

    // 4. Robust body scroll lock
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;

      // 5. Restore focus to trigger
      const toFocus = triggerSnapshot ?? triggerElRef.current;
      toFocus?.focus();
    };
  }, [
    isOpen,
    containerRef,
    triggerRef,
    initialFocusRef,
    playCloseSound,
    preventMobileAutoFocus,
  ]);
}
