"use client";

import * as React from "react";
import { initSound } from "@/lib/sound";

export function SoundProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    initSound();
  }, []);

  return <>{children}</>;
}
