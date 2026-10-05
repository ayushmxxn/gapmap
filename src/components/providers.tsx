"use client";

import * as React from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { SoundProvider } from "@/components/sound-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SoundProvider>{children}</SoundProvider>
    </ThemeProvider>
  );
}
