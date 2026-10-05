"use client";

import * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/query-client";
import { ThemeProvider } from "@/components/theme-provider";
import { SoundProvider } from "@/components/sound-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = React.useMemo(() => getQueryClient(), []);
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SoundProvider>{children}</SoundProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
